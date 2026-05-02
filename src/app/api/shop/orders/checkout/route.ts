import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import {
  attachOrderCheckoutSession,
  createPendingOrder,
  getActiveListingById,
  platformFeeCents,
} from "@/lib/shop/marketplace";

const payloadSchema = z.object({
  listingId: z.string().uuid(),
  buyerEmail: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid order payload" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ ok: false, error: "Payment is not configured." }, { status: 503 });
  }

  const listing = await getActiveListingById(parsed.data.listingId);
  if (!listing) {
    return NextResponse.json({ ok: false, error: "Listing not available" }, { status: 404 });
  }

  const itemSubtotal = listing.price_cents;
  const shipping = listing.shipping_cents;
  const platformFee = platformFeeCents(itemSubtotal);
  const subtotalWithShipping = itemSubtotal + shipping;
  const amountToCharge = subtotalWithShipping + platformFee;

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-03-25.dahlia" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const { orderId } = await createPendingOrder({
      listingId: listing.id,
      buyerEmail: parsed.data.buyerEmail,
      itemSubtotalCents: itemSubtotal,
      shippingCents: shipping,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${baseUrl}/shop-la-caille/ashti/${listing.id}?order=success`,
      cancel_url: `${baseUrl}/shop-la-caille/ashti/${listing.id}?order=cancel`,
      metadata: {
        marketplaceOrderId: orderId,
      },
      customer_email: parsed.data.buyerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: itemSubtotal,
            product_data: {
              name: listing.title,
              description: "Atik — pri san transpò",
            },
          },
        },
        ...(shipping > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: shipping,
                  product_data: {
                    name: "Transpò",
                    description: "Frè transpò (pa nan kalkil 7%)",
                  },
                },
              } as const,
            ]
          : []),
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: platformFee,
            product_data: {
              name: "Frè platfòm Shop Lakay (7% sou atik)",
              description: "Sèvis mache — aplike sou pri atik sèlman",
            },
          },
        },
      ],
    });

    if (!session.id || !session.url) {
      throw new Error("Stripe session missing");
    }

    await attachOrderCheckoutSession(orderId, session.id);

    return NextResponse.json({
      ok: true,
      orderId,
      checkoutUrl: session.url,
      breakdown: {
        itemSubtotalCents: itemSubtotal,
        shippingCents: shipping,
        platformFeeCents: platformFee,
        buyerTotalCents: amountToCharge,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Checkout failed",
      },
      { status: 500 },
    );
  }
}
