import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import {
  attachPostingCheckoutSession,
  createPendingPostingListing,
  POSTING_FEE_CENTS,
} from "@/lib/shop/marketplace";

const payloadSchema = z.object({
  sellerName: z.string().min(2).max(120),
  sellerEmail: z.string().email(),
  sellerPhone: z.string().max(40).optional().or(z.literal("")),
  title: z.string().min(3).max(120),
  description: z.string().max(5000).optional().default(""),
  priceCents: z.number().int().min(100).max(10_000_000),
  shippingCents: z.number().int().min(0).max(10_000_000),
  imageUrls: z.array(z.string().url()).min(1).max(8),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid listing payload" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { ok: false, error: "Payment is not configured yet." },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-03-25.dahlia" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const listingId = await createPendingPostingListing({
      sellerName: parsed.data.sellerName,
      sellerEmail: parsed.data.sellerEmail,
      sellerPhone: parsed.data.sellerPhone || undefined,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      priceCents: parsed.data.priceCents,
      shippingCents: parsed.data.shippingCents,
      imageUrls: parsed.data.imageUrls,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${baseUrl}/shop-la-caille/vann?checkout=success&listingId=${listingId}`,
      cancel_url: `${baseUrl}/shop-la-caille/vann?checkout=cancel&listingId=${listingId}`,
      metadata: {
        marketplaceListingId: listingId,
      },
      customer_email: parsed.data.sellerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: POSTING_FEE_CENTS,
            product_data: {
              name: "Shop Lakay — fra pibliyasyon",
              description: "99¢ pou mete atik ou sou Shop Lakay",
            },
          },
        },
      ],
    });

    if (!session.id || !session.url) {
      throw new Error("Stripe session missing id or url");
    }

    await attachPostingCheckoutSession(listingId, session.id);

    return NextResponse.json({
      ok: true,
      listingId,
      checkoutUrl: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create checkout",
      },
      { status: 500 },
    );
  }
}
