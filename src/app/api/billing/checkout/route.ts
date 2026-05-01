import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { getBillingSubscriptionByUserId } from "@/lib/billing/subscriptions";

const payloadSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  priceId: z.string().min(1).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid billing checkout payload" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { ok: false, error: "Billing is not configured yet. Please try again later." },
      { status: 503 },
    );
  }

  const configuredPriceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
  const priceId = parsed.data.priceId ?? configuredPriceId;
  if (!priceId) {
    return NextResponse.json(
      { ok: false, error: "Missing subscription price configuration" },
      { status: 503 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = new Stripe(stripeKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  const existing = await getBillingSubscriptionByUserId(parsed.data.userId);
  const successUrl = parsed.data.successUrl ?? `${baseUrl}/?billing=success`;
  const cancelUrl = parsed.data.cancelUrl ?? `${baseUrl}/?billing=cancel`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: existing?.stripeCustomerId,
      customer_email: existing ? undefined : parsed.data.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: parsed.data.userId,
      },
      subscription_data: {
        metadata: {
          userId: parsed.data.userId,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create billing session" },
      { status: 500 },
    );
  }
}
