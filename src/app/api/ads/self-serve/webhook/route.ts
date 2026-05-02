import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { markOrderPaid } from "@/lib/ads/selfServe";
import { tryProcessMarketplaceCheckoutSession } from "@/lib/shop/stripeWebhook";

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid stripe signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const shop = await tryProcessMarketplaceCheckoutSession(session);
      if (shop.handled) {
        return NextResponse.json({
          ok: true,
          processed: true,
          shopKind: shop.kind,
          shopResult: shop.result,
          eventType: event.type,
        });
      }
    } catch (error) {
      console.error("Marketplace checkout handler failed", error);
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Marketplace handler failed",
        },
        { status: 500 },
      );
    }

    const orderId = session.metadata?.adOrderId;
    if (!orderId) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "not_self_serve_ad_checkout",
        eventType: event.type,
        sessionId: session.id,
      });
    }

    try {
      const activation = await markOrderPaid({
        orderId,
        paymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : undefined,
      });
      return NextResponse.json({
        ok: true,
        processed: true,
        eventType: event.type,
        activationStatus: activation.status,
      });
    } catch (error) {
      console.error("Failed to activate self-serve ad order from webhook", {
        eventId: event.id,
        orderId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Failed to activate ad order",
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, ignored: true, eventType: event.type });
}
