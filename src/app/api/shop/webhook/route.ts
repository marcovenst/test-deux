import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getEnv } from "@/lib/config/env";
import { tryProcessMarketplaceCheckoutSession } from "@/lib/shop/stripeWebhook";

function getStripeClient(secretKey: string) {
  return new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });
}

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const env = getEnv();
  const webhookSecret = env.STRIPE_SHOP_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Shop Stripe webhook not configured" }, { status: 503 });
  }

  const stripe = getStripeClient(stripeKey);
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

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: true, eventType: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    const shop = await tryProcessMarketplaceCheckoutSession(session);
    if (shop.handled) {
      return NextResponse.json({
        ok: true,
        processed: true,
        kind: shop.kind,
        result: shop.result,
      });
    }
  } catch (error) {
    console.error("Shop webhook error", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Shop webhook failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, ignored: true, reason: "not_shop_checkout" });
}
