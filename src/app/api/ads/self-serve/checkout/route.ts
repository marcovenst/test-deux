import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import {
  attachCheckoutSession,
  createSelfServeAdOrder,
  getSelfServeAdPlan,
} from "@/lib/ads/selfServe";

const payloadSchema = z.object({
  businessName: z.string().min(2).max(120),
  contactEmail: z.string().email(),
  title: z.string().min(3).max(120),
  imageUrl: z.string().url(),
  targetUrl: z.string().url(),
  description: z.string().max(220).optional().default(""),
  planId: z.enum(["daily_1", "bundle_5", "monthly_30"]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid ad payload" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payment is not configured yet. Please try again later.",
      },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2026-03-25.dahlia",
  });
  const selectedPlan = getSelfServeAdPlan(parsed.data.planId);
  if (!selectedPlan) {
    return NextResponse.json({ ok: false, error: "Invalid plan selected" }, { status: 400 });
  }
  try {
    const adOrder = await createSelfServeAdOrder(parsed.data);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${baseUrl}/?ad_checkout=success`,
      cancel_url: `${baseUrl}/?ad_checkout=cancel`,
      metadata: {
        adOrderId: adOrder.id,
      },
      customer_email: parsed.data.contactEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: selectedPlan.amountCents,
            product_data: {
              name: "Zen Rezo A self-serve ad",
              description: `Run your ad on Zen Rezo A for ${selectedPlan.durationDays} day(s)`,
            },
          },
        },
      ],
    });

    await attachCheckoutSession(adOrder.id, session.id);

    return NextResponse.json({
      ok: true,
      adOrderId: adOrder.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create ad checkout session",
      },
      { status: 500 },
    );
  }
}
