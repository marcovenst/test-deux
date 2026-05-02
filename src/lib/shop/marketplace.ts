import { randomBytes } from "node:crypto";

import { supabaseAdmin } from "@/lib/db/client";
import type {
  MarketplaceListingRow,
  MarketplacePayoutMethod,
  MarketplaceSellerRow,
} from "@/lib/db/types";

export const POSTING_FEE_CENTS = 99; // legacy — posting fee checkout no longer used for new listings
/** Minimum Cashout amount (USD). Fulfillment is Zelle, ACH, or debit_card per `marketplace_payout_requests.method`. */
export const MIN_PAYOUT_CENTS = 2000; // $20 minimum cash-out request
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

export async function getOrCreateSeller(input: {
  email: string;
  displayName: string;
  phone?: string | null;
}): Promise<{ id: string; accessToken: string }> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const phone = input.phone?.trim() || null;

  const { data: existing, error: findErr } = await supabaseAdmin
    .from("marketplace_sellers")
    .select("id, access_token")
    .eq("email", email)
    .maybeSingle();
  if (findErr) throw findErr;

  const now = new Date().toISOString();

  if (existing) {
    const { error: upErr } = await supabaseAdmin
      .from("marketplace_sellers")
      .update({
        display_name: displayName,
        phone,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (upErr) throw upErr;
    return { id: existing.id as string, accessToken: existing.access_token as string };
  }

  const accessToken = randomBytes(24).toString("hex");
  const { data: created, error: insErr } = await supabaseAdmin
    .from("marketplace_sellers")
    .insert({
      email,
      display_name: displayName,
      phone,
      access_token: accessToken,
      created_at: now,
      updated_at: now,
    })
    .select("id, access_token")
    .single();
  if (insErr) throw insErr;
  return { id: created.id as string, accessToken: created.access_token as string };
}

/** Publish listing immediately (no upfront 99¢); links seller account for earnings / cash-out. */
export async function createActiveListingWithSeller(input: CreateMarketplaceListingInput): Promise<{
  listingId: string;
  sellerAccessToken: string;
}> {
  assertValidListingInput(input);
  const seller = await getOrCreateSeller({
    email: input.sellerEmail,
    displayName: input.sellerName,
    phone: input.sellerPhone ?? null,
  });
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("marketplace_listings")
    .insert({
      seller_id: seller.id,
      seller_name: input.sellerName.trim(),
      seller_email: input.sellerEmail.trim().toLowerCase(),
      seller_phone: input.sellerPhone?.trim() || null,
      title: input.title.trim(),
      description: input.description.trim(),
      price_cents: input.priceCents,
      shipping_cents: input.shippingCents,
      currency: "usd",
      image_urls: input.imageUrls,
      status: "active",
      updated_at: now,
      created_at: now,
    })
    .select("id")
    .single();
  if (error) throw error;
  return {
    listingId: data.id as string,
    sellerAccessToken: seller.accessToken,
  };
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

export async function createPendingCatalogOrder(input: {
  catalogItemId: string;
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
      listing_id: null,
      catalog_item_id: input.catalogItemId,
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

async function recordSellerCreditForCompletedSale(input: {
  orderId: string;
  listingId: string;
  itemSubtotalCents: number;
  shippingCents: number;
}) {
  const { data: existing } = await supabaseAdmin
    .from("marketplace_seller_ledger")
    .select("id")
    .eq("order_id", input.orderId)
    .eq("entry_type", "sale_credit")
    .maybeSingle();
  if (existing) return;

  const { data: listing, error: lerr } = await supabaseAdmin
    .from("marketplace_listings")
    .select("id,seller_id,seller_email,seller_name,seller_phone")
    .eq("id", input.listingId)
    .maybeSingle();
  if (lerr) throw lerr;
  if (!listing) throw new Error("Listing missing after sale");

  let sellerId = listing.seller_id as string | null;
  if (!sellerId) {
    const seller = await getOrCreateSeller({
      email: listing.seller_email as string,
      displayName: ((listing.seller_name as string) || "Seller").trim(),
      phone: (listing.seller_phone as string | null) ?? null,
    });
    sellerId = seller.id;
    await supabaseAdmin
      .from("marketplace_listings")
      .update({ seller_id: sellerId, updated_at: new Date().toISOString() })
      .eq("id", input.listingId);
  }

  const credit = input.itemSubtotalCents + input.shippingCents;
  if (credit <= 0) return;

  const { error: insErr } = await supabaseAdmin.from("marketplace_seller_ledger").insert({
    seller_id: sellerId,
    entry_type: "sale_credit",
    amount_cents: credit,
    order_id: input.orderId,
    memo: "Lajan vann (pri atik + transpò). Frè platfòm 7% peye pa achtè a.",
    created_at: new Date().toISOString(),
  });
  if (insErr) throw insErr;
}

export async function markMarketplaceOrderPaid(input: {
  orderId: string;
  paymentIntentId?: string;
  checkoutSessionId?: string;
}) {
  const { data: order, error: oerr } = await supabaseAdmin
    .from("marketplace_orders")
    .select(
      "id,listing_id,catalog_item_id,status,stripe_checkout_session_id,item_subtotal_cents,shipping_cents",
    )
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

  const listingId = order.listing_id as string | null;
  const itemSubtotalCents = order.item_subtotal_cents as number;
  const shippingCents = order.shipping_cents as number;
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

  if (listingId) {
    const { error: u2 } = await supabaseAdmin
      .from("marketplace_listings")
      .update({ status: "sold_out", updated_at: now })
      .eq("id", listingId)
      .eq("status", "active");
    if (u2) throw u2;

    await recordSellerCreditForCompletedSale({
      orderId: input.orderId,
      listingId,
      itemSubtotalCents,
      shippingCents,
    });
  }

  return { orderId: input.orderId, status: "paid" as const };
}

/** Coerce Supabase/Postgres image_urls into a clean HTTPS URL list (handles null, JSON, or odd shapes). */
export function normalizeListingImageUrls(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === "string" && u.trim().length > 0).map((u) => u.trim());
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((u): u is string => typeof u === "string" && u.trim().length > 0).map((u) => u.trim());
      }
    } catch {
      /* single URL string */
    }
    return [s];
  }
  return [];
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
    imageUrls: normalizeListingImageUrls(row.image_urls),
    status: row.status as ListingStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type PublicListing = ReturnType<typeof fromListingRow>;

function marketplaceBrowseErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (
    code === "PGRST205" ||
    message.toLowerCase().includes("marketplace_listings") ||
    message.toLowerCase().includes("marketplace_sellers")
  ) {
    return "Baz donne a pa gen tab katalòg oswa kont vann yo ankò. Verifye ke migrasyon 0008_marketplace, 0009_marketplace_sellers, ak 0010_marketplace_catalog aplike sou Supabase.";
  }
  return "Pa ka chaje atik yo kounye a. Eseye ankò pita.";
}

/** Safe for SSR: never throws; returns user-facing error when DB is missing or query fails. */
export async function fetchActiveListingsForDisplay(limit = 48): Promise<{
  listings: PublicListing[];
  error: string | null;
}> {
  try {
    const rows = await listActiveListings(limit);
    return { listings: rows.map(fromListingRow), error: null };
  } catch (e) {
    console.error("fetchActiveListingsForDisplay", e);
    return { listings: [], error: marketplaceBrowseErrorMessage(e) };
  }
}

export async function fetchActiveListingForDisplay(id: string): Promise<{
  listing: PublicListing | null;
  error: string | null;
}> {
  try {
    const row = await getActiveListingById(id);
    if (!row) return { listing: null, error: null };
    return { listing: fromListingRow(row), error: null };
  } catch (e) {
    console.error("fetchActiveListingForDisplay", e);
    return { listing: null, error: marketplaceBrowseErrorMessage(e) };
  }
}

export async function getSellerByAccessToken(token: string): Promise<MarketplaceSellerRow | null> {
  const t = token.trim();
  if (!t || t.length < 24) return null;
  const { data, error } = await supabaseAdmin
    .from("marketplace_sellers")
    .select("*")
    .eq("access_token", t)
    .maybeSingle();
  if (error) throw error;
  return data as MarketplaceSellerRow | null;
}

export async function getSellerBalanceSnapshot(sellerId: string): Promise<{
  ledgerBalanceCents: number;
  pendingPayoutReserveCents: number;
  availableToCashOutCents: number;
}> {
  const { data: ledgerRows, error: lErr } = await supabaseAdmin
    .from("marketplace_seller_ledger")
    .select("amount_cents")
    .eq("seller_id", sellerId);
  if (lErr) throw lErr;
  const ledgerBalanceCents = (ledgerRows ?? []).reduce((s, r) => s + (r.amount_cents as number), 0);

  const { data: pendingRows, error: pErr } = await supabaseAdmin
    .from("marketplace_payout_requests")
    .select("amount_cents")
    .eq("seller_id", sellerId)
    .in("status", ["pending", "approved"]);
  if (pErr) throw pErr;
  const pendingPayoutReserveCents = (pendingRows ?? []).reduce(
    (s, r) => s + (r.amount_cents as number),
    0,
  );

  return {
    ledgerBalanceCents,
    pendingPayoutReserveCents,
    availableToCashOutCents: Math.max(0, ledgerBalanceCents - pendingPayoutReserveCents),
  };
}

export type SellerDashboardLedgerRow = {
  id: string;
  entry_type: string;
  amount_cents: number;
  memo: string | null;
  created_at: string;
  order_id: string | null;
};

export type SellerDashboardPayoutRow = {
  id: string;
  amount_cents: number;
  method: string;
  status: string;
  created_at: string;
};

export async function getSellerDashboardData(accessToken: string): Promise<{
  seller: { email: string; displayName: string };
  ledgerBalanceCents: number;
  pendingPayoutReserveCents: number;
  availableToCashOutCents: number;
  ledger: SellerDashboardLedgerRow[];
  payouts: SellerDashboardPayoutRow[];
} | null> {
  const seller = await getSellerByAccessToken(accessToken);
  if (!seller) return null;

  const snapshot = await getSellerBalanceSnapshot(seller.id);

  const { data: ledger, error: lErr } = await supabaseAdmin
    .from("marketplace_seller_ledger")
    .select("id,entry_type,amount_cents,memo,created_at,order_id")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false })
    .limit(40);
  if (lErr) throw lErr;

  const { data: payouts, error: pErr } = await supabaseAdmin
    .from("marketplace_payout_requests")
    .select("id,amount_cents,method,status,created_at")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (pErr) throw pErr;

  return {
    seller: { email: seller.email, displayName: seller.display_name },
    ...snapshot,
    ledger: (ledger ?? []) as SellerDashboardLedgerRow[],
    payouts: (payouts ?? []) as SellerDashboardPayoutRow[],
  };
}

export async function createPayoutRequestFromSellerToken(input: {
  accessToken: string;
  amountCents: number;
  method: MarketplacePayoutMethod;
  recipient: Record<string, unknown>;
}): Promise<{ payoutRequestId: string }> {
  if (input.amountCents < MIN_PAYOUT_CENTS) {
    throw new Error(`Minimum cash out is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}`);
  }
  const seller = await getSellerByAccessToken(input.accessToken);
  if (!seller) throw new Error("Invalid seller session");

  const snap = await getSellerBalanceSnapshot(seller.id);
  if (input.amountCents > snap.availableToCashOutCents) {
    throw new Error("Amount exceeds available balance");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("marketplace_payout_requests")
    .insert({
      seller_id: seller.id,
      amount_cents: input.amountCents,
      method: input.method,
      status: "pending",
      recipient: input.recipient,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { payoutRequestId: data.id as string };
}

export async function adminMarkPayoutPaid(payoutRequestId: string): Promise<{
  ok: true;
  already: boolean;
}> {
  const { data: row, error: ferr } = await supabaseAdmin
    .from("marketplace_payout_requests")
    .select("*")
    .eq("id", payoutRequestId)
    .maybeSingle();
  if (ferr) throw ferr;
  if (!row) throw new Error("Payout not found");
  if (row.status === "paid") {
    return { ok: true, already: true };
  }
  if (row.status !== "pending" && row.status !== "approved") {
    throw new Error(`Cannot complete payout in status ${row.status}`);
  }

  const sellerId = row.seller_id as string;
  const amount = row.amount_cents as number;
  const method = row.method as string;
  const now = new Date().toISOString();

  const { data: dup } = await supabaseAdmin
    .from("marketplace_seller_ledger")
    .select("id")
    .eq("payout_request_id", payoutRequestId)
    .eq("entry_type", "payout_debit")
    .maybeSingle();

  if (!dup) {
    const { error: insErr } = await supabaseAdmin.from("marketplace_seller_ledger").insert({
      seller_id: sellerId,
      entry_type: "payout_debit",
      amount_cents: -amount,
      payout_request_id: payoutRequestId,
      memo: `Cash out (${method})`,
      created_at: now,
    });
    if (insErr) throw insErr;
  }

  const { error: uErr } = await supabaseAdmin
    .from("marketplace_payout_requests")
    .update({ status: "paid", updated_at: now })
    .eq("id", payoutRequestId);
  if (uErr) throw uErr;

  return { ok: true, already: Boolean(dup) };
}
