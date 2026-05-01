import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { getBillingSubscriptionByUserId } from "@/lib/billing/subscriptions";

const payloadSchema = z.object({
  userId: z.string().min(1),
  returnUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid billing portal payload" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ ok: false, error: "Billing is not configured yet" }, { status: 503 });
  }

  const subscription = await getBillingSubscriptionByUserId(parsed.data.userId);
  if (!subscription) {
    return NextResponse.json({ ok: false, error: "No billing profile found for user" }, { status: 404 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2026-03-25.dahlia",
  });
  const returnUrl = parsed.data.returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({
      ok: true,
      portalUrl: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create billing portal session" },
      { status: 500 },
    );
  }
}
