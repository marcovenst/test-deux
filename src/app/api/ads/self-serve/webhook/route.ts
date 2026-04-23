import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { markOrderPaid } from "@/lib/ads/selfServe";

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
    const orderId = session.metadata?.adOrderId;
    if (orderId) {
      try {
        await markOrderPaid({
          orderId,
          paymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : undefined,
        });
      } catch (error) {
        return NextResponse.json(
          {
            ok: false,
            error: error instanceof Error ? error.message : "Failed to activate ad order",
          },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
