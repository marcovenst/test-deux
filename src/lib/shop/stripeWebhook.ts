import type Stripe from "stripe";

import { markListingPostingPaid, markMarketplaceOrderPaid } from "@/lib/shop/marketplace";

export type MarketplaceWebhookResult =
  | { handled: false }
  | { handled: true; kind: "listing_posting"; result: Awaited<ReturnType<typeof markListingPostingPaid>> }
  | { handled: true; kind: "buyer_order"; result: Awaited<ReturnType<typeof markMarketplaceOrderPaid>> };

export async function tryProcessMarketplaceCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<MarketplaceWebhookResult> {
  const listingId = session.metadata?.marketplaceListingId;
  const orderId = session.metadata?.marketplaceOrderId;

  if (listingId && orderId) {
    throw new Error("Ambiguous marketplace checkout metadata");
  }

  if (listingId) {
    const result = await markListingPostingPaid({
      listingId,
      checkoutSessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    });
    return { handled: true, kind: "listing_posting", result };
  }

  if (orderId) {
    const result = await markMarketplaceOrderPaid({
      orderId,
      checkoutSessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    });
    return { handled: true, kind: "buyer_order", result };
  }

  return { handled: false };
}
