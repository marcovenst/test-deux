import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  markBillingPaymentFailed,
  syncBillingFromCheckoutSession,
  syncBillingFromSubscriptionObject,
} from "@/lib/billing/subscriptions";

function getStripeClient(secretKey: string) {
  return new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Billing webhook not configured" }, { status: 503 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe signature" }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripeClient(stripeKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid stripe signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") {
          return NextResponse.json({ ok: true, ignored: true, eventType: event.type });
        }

        const userId = session.metadata?.userId;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (!userId || !subscriptionId || !customerId) {
          return NextResponse.json(
            { ok: false, error: "Missing userId/customer/subscription in checkout completion event" },
            { status: 400 },
          );
        }

        await syncBillingFromCheckoutSession({
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeEventId: event.id,
          stripeEventCreated: event.created,
        });

        return NextResponse.json({ ok: true, processed: true, eventType: event.type });
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncBillingFromSubscriptionObject({
          subscription,
          userIdHint: subscription.metadata?.userId,
          stripeEventId: event.id,
          stripeEventCreated: event.created,
        });
        return NextResponse.json({ ok: true, processed: true, eventType: event.type });
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        const subscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (!customerId) {
          return NextResponse.json(
            { ok: false, error: "Missing customer on invoice.payment_failed event" },
            { status: 400 },
          );
        }

        await markBillingPaymentFailed({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeEventId: event.id,
          stripeEventCreated: event.created,
        });
        return NextResponse.json({ ok: true, processed: true, eventType: event.type });
      }
      default:
        return NextResponse.json({ ok: true, ignored: true, eventType: event.type });
    }
  } catch (error) {
    console.error("Billing webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Billing webhook processing failed" },
      { status: 500 },
    );
  }
}
