/**
 * Curated catalog for Achte browse:
 * - `on_platform`: Stripe Checkout on your account (item + shipping + 7% fee); you keep revenue; no peer seller split.
 * - `external_affiliate`: Outbound link; affiliate commissions are paid by the partner program (e.g. Amazon), not via Stripe.
 */
import { supabaseAdmin } from "@/lib/db/client";
import type { MarketplaceCatalogItemRow } from "@/lib/db/types";

import {
  fetchActiveListingsForDisplay,
  normalizeListingImageUrls,
  type PublicListing,
} from "@/lib/shop/marketplace";

export type PublicCatalogItem = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  shippingCents: number;
  currency: string;
  imageUrls: string[];
  purchaseMode: "on_platform" | "external_affiliate";
  externalUrl: string | null;
  affiliateNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export function fromCatalogRow(row: MarketplaceCatalogItemRow): PublicCatalogItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceCents: row.price_cents,
    shippingCents: row.shipping_cents,
    currency: row.currency,
    imageUrls: normalizeListingImageUrls(row.image_urls),
    purchaseMode: row.purchase_mode,
    externalUrl: row.external_url,
    affiliateNote: row.affiliate_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listActiveCatalogItems(limit = 60): Promise<MarketplaceCatalogItemRow[]> {
  const { data, error } = await supabaseAdmin
    .from("marketplace_catalog_items")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MarketplaceCatalogItemRow[];
}

export async function getActiveCatalogItemById(id: string): Promise<MarketplaceCatalogItemRow | null> {
  const { data, error } = await supabaseAdmin
    .from("marketplace_catalog_items")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data as MarketplaceCatalogItemRow | null;
}

export type AchteBrowseItem =
  | { kind: "listing"; createdAt: string; listing: PublicListing }
  | { kind: "catalog"; createdAt: string; catalog: PublicCatalogItem };

function catalogBrowseErrorMessage(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "PGRST205" || message.toLowerCase().includes("marketplace_catalog_items")) {
    return "Tab katalòg platfòm nan (0010_marketplace_catalog) pa aplike sou baz la.";
  }
  return null;
}

export async function fetchCatalogForDisplay(limit = 24): Promise<{
  items: PublicCatalogItem[];
  error: string | null;
}> {
  try {
    const rows = await listActiveCatalogItems(limit);
    return { items: rows.map(fromCatalogRow), error: null };
  } catch (e) {
    console.error("fetchCatalogForDisplay", e);
    return { items: [], error: catalogBrowseErrorMessage(e) ?? "Pa ka chaje katalòg la." };
  }
}

export function mergeAchteBrowseItems(
  listings: PublicListing[],
  catalog: PublicCatalogItem[],
): AchteBrowseItem[] {
  const a: AchteBrowseItem[] = listings.map((listing) => ({
    kind: "listing",
    createdAt: listing.createdAt,
    listing,
  }));
  const b: AchteBrowseItem[] = catalog.map((c) => ({
    kind: "catalog",
    createdAt: c.createdAt,
    catalog: c,
  }));
  return [...a, ...b].sort((x, y) => (x.createdAt < y.createdAt ? 1 : -1));
}

export async function fetchAchteBrowseForDisplay(listingLimit = 40, catalogLimit = 24): Promise<{
  items: AchteBrowseItem[];
  error: string | null;
}> {
  const [L, C] = await Promise.all([
    fetchActiveListingsForDisplay(listingLimit),
    fetchCatalogForDisplay(catalogLimit),
  ]);
  const parts = [L.error, C.error].filter(Boolean);
  const err = parts.length ? parts.join(" ") : null;
  return {
    items: mergeAchteBrowseItems(L.listings, C.items),
    error: err,
  };
}

export async function fetchCatalogDetailForDisplay(id: string): Promise<{
  item: PublicCatalogItem | null;
  error: string | null;
}> {
  try {
    const row = await getActiveCatalogItemById(id);
    if (!row) return { item: null, error: null };
    return { item: fromCatalogRow(row), error: null };
  } catch (e) {
    console.error("fetchCatalogDetailForDisplay", e);
    return { item: null, error: catalogBrowseErrorMessage(e) ?? "Erè katalòg." };
  }
}
