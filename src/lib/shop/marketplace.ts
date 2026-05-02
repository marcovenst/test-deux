import { supabaseAdmin } from "@/lib/db/client";
import type { MarketplaceListingRow } from "@/lib/db/types";

export const POSTING_FEE_CENTS = 99;
export const PLATFORM_FEE_RATE = 0.07;
export const MAX_LISTING_IMAGES = 8;
export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MIN_PRICE_CENTS = 100;
export const MAX_PRICE_CENTS = 10_000_000;

export type ListingStatus =
  | "draft"
  | "pending_posting_payment"
  | "active"
  | "paused"
  | "sold_out";

export type OrderStatus = "pending_payment" | "paid" | "cancelled";

export function platformFeeCents(itemSubtotalCents: number): number {
  if (itemSubtotalCents <= 0) return 0;
  return Math.round(itemSubtotalCents * PLATFORM_FEE_RATE);
}

export function buyerTotalCents(itemSubtotalCents: number, shippingCents: number): number {
  return itemSubtotalCents + shippingCents;
}

export function sellerProceedsCents(itemSubtotalCents: number, shippingCents: number): number {
  return itemSubtotalCents + shippingCents;
}

export type CreateMarketplaceListingInput = {
  sellerName: string;
  sellerEmail: string;
  sellerPhone?: string;
  title: string;
  description: string;
  priceCents: number;
  shippingCents: number;
  imageUrls: string[];
};

export function assertValidListingInput(input: CreateMarketplaceListingInput) {
  if (!input.sellerName.trim() || input.sellerName.length > 120) {
    throw new Error("Invalid seller name");
  }
  if (!input.sellerEmail.includes("@") || input.sellerEmail.length > 320) {
    throw new Error("Invalid seller email");
  }
  if (input.sellerPhone && input.sellerPhone.length > 40) {
    throw new Error("Invalid seller phone");
  }
  if (!input.title.trim() || input.title.length > MAX_TITLE_LENGTH) {
    throw new Error("Invalid title");
  }
  if (input.description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error("Description too long");
  }
  if (input.priceCents < MIN_PRICE_CENTS || input.priceCents > MAX_PRICE_CENTS) {
    throw new Error("Invalid price");
  }
  if (input.shippingCents < 0 || input.shippingCents > MAX_PRICE_CENTS) {
    throw new Error("Invalid shipping");
  }
  if (input.imageUrls.length < 1 || input.imageUrls.length > MAX_LISTING_IMAGES) {
    throw new Error(`Provide between 1 and ${MAX_LISTING_IMAGES} images`);
  }
  const allowed = /^https:\/\//i;
  for (const url of input.imageUrls) {
    if (!allowed.test(url.trim())) {
      throw new Error("Images must use HTTPS URLs");
    }
  }
}

export async function createPendingPostingListing(input: CreateMarketplaceListingInput) {
  assertValidListingInput(input);
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("marketplace_listings")
    .insert({
      seller_name: input.sellerName.trim(),
      seller_email: input.sellerEmail.trim().toLowerCase(),
      seller_phone: input.sellerPhone?.trim() || null,
      title: input.title.trim(),
      description: input.description.trim(),
      price_cents: input.priceCents,
      shipping_cents: input.shippingCents,
      currency: "usd",
      image_urls: input.imageUrls,
      status: "pending_posting_payment",
      updated_at: now,
      created_at: now,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function attachPostingCheckoutSession(listingId: string, sessionId: string) {
  const { error } = await supabaseAdmin
    .from("marketplace_listings")
    .update({
      stripe_posting_checkout_session_id: sessionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("status", "pending_posting_payment");
  if (error) throw error;
}

export async function markListingPostingPaid(input: {
  listingId: string;
  paymentIntentId?: string;
  checkoutSessionId?: string;
}) {
  const { data: row, error: fetchError } = await supabaseAdmin
    .from("marketplace_listings")
    .select("id,status,stripe_posting_checkout_session_id")
    .eq("id", input.listingId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!row) throw new Error("Listing not found");
  if (row.status === "active") {
    return { listingId: input.listingId, status: "already_active" as const };
  }
  if (row.status !== "pending_posting_payment") {
    throw new Error(`Listing cannot be activated from status ${row.status}`);
  }
  if (
    input.checkoutSessionId &&
    row.stripe_posting_checkout_session_id &&
    row.stripe_posting_checkout_session_id !== input.checkoutSessionId
  ) {
    throw new Error("Checkout session mismatch");
  }

  const { error } = await supabaseAdmin
    .from("marketplace_listings")
    .update({
      status: "active",
      stripe_posting_payment_intent_id: input.paymentIntentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.listingId)
    .eq("status", "pending_posting_payment");
  if (error) throw error;
  return { listingId: input.listingId, status: "activated" as const };
}

export async function listActiveListings(limit = 60): Promise<MarketplaceListingRow[]> {
  const { data, error } = await supabaseAdmin
    .from("marketplace_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MarketplaceListingRow[];
}

export async function getActiveListingById(id: string): Promise<MarketplaceListingRow | null> {
  const { data, error } = await supabaseAdmin
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data as MarketplaceListingRow | null;
}

export async function getListingByIdForPublic(id: string): Promise<MarketplaceListingRow | null> {
  return getActiveListingById(id);
}

export async function createPendingOrder(input: {
  listingId: string;
  buyerEmail: string;
  itemSubtotalCents: number;
  shippingCents: number;
}) {
  const platform = platformFeeCents(input.itemSubtotalCents);
  const buyerTotal = input.itemSubtotalCents + input.shippingCents + platform;
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("marketplace_orders")
    .insert({
      listing_id: input.listingId,
      buyer_email: input.buyerEmail.trim().toLowerCase(),
      quantity: 1,
      item_subtotal_cents: input.itemSubtotalCents,
      shipping_cents: input.shippingCents,
      buyer_total_cents: buyerTotal,
      platform_fee_cents: platform,
      currency: "usd",
      status: "pending_payment",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (error) throw error;
  return {
    orderId: data.id as string,
    buyerTotalCents: buyerTotal,
    platformFeeCents: platform,
  };
}

export async function attachOrderCheckoutSession(orderId: string, sessionId: string) {
  const { error } = await supabaseAdmin
    .from("marketplace_orders")
    .update({
      stripe_checkout_session_id: sessionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending_payment");
  if (error) throw error;
}

export async function markMarketplaceOrderPaid(input: {
  orderId: string;
  paymentIntentId?: string;
  checkoutSessionId?: string;
}) {
  const { data: order, error: oerr } = await supabaseAdmin
    .from("marketplace_orders")
    .select("id,listing_id,status,stripe_checkout_session_id")
    .eq("id", input.orderId)
    .maybeSingle();
  if (oerr) throw oerr;
  if (!order) throw new Error("Order not found");
  if (order.status === "paid") {
    return { orderId: input.orderId, status: "already_paid" as const };
  }
  if (order.status !== "pending_payment") {
    throw new Error(`Order cannot be paid from status ${order.status}`);
  }
  if (
    input.checkoutSessionId &&
    order.stripe_checkout_session_id &&
    order.stripe_checkout_session_id !== input.checkoutSessionId
  ) {
    throw new Error("Checkout session mismatch");
  }

  const listingId = order.listing_id as string;
  const now = new Date().toISOString();

  const { error: u1 } = await supabaseAdmin
    .from("marketplace_orders")
    .update({
      status: "paid",
      stripe_payment_intent_id: input.paymentIntentId ?? null,
      updated_at: now,
    })
    .eq("id", input.orderId)
    .eq("status", "pending_payment");
  if (u1) throw u1;

  const { error: u2 } = await supabaseAdmin
    .from("marketplace_listings")
    .update({ status: "sold_out", updated_at: now })
    .eq("id", listingId)
    .eq("status", "active");
  if (u2) throw u2;

  return { orderId: input.orderId, status: "paid" as const };
}

export function fromListingRow(row: MarketplaceListingRow) {
  return {
    id: row.id,
    sellerName: row.seller_name,
    sellerEmail: row.seller_email,
    sellerPhone: row.seller_phone,
    title: row.title,
    description: row.description,
    priceCents: row.price_cents,
    shippingCents: row.shipping_cents,
    currency: row.currency,
    imageUrls: row.image_urls,
    status: row.status as ListingStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type PublicListing = ReturnType<typeof fromListingRow>;
