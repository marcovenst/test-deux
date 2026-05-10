import { supabaseAdmin } from "@/lib/db/client";
export const DEFAULT_AMAZON_AFFILIATE_NOTE =
  "Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.";

export type AffiliateCatalogUpsertInput = {
  externalUrl: string;
  title: string;
  description: string;
  priceCents: number;
  shippingCents: number;
  currency: string;
  imageUrls: string[];
  affiliateNote?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export type AffiliateCatalogUpsertResult =
  | { ok: true; externalUrl: string; id: string; created: boolean }
  | { ok: false; externalUrl: string; error: string };

function normalizeExternalUrl(url: string): string {
  return url.trim();
}

export async function upsertAffiliateCatalogItem(
  input: AffiliateCatalogUpsertInput,
): Promise<AffiliateCatalogUpsertResult> {
  const externalUrl = normalizeExternalUrl(input.externalUrl);
  if (!externalUrl) {
    return { ok: false, externalUrl: input.externalUrl, error: "externalUrl is empty" };
  }

  const affiliateNote = (input.affiliateNote ?? DEFAULT_AMAZON_AFFILIATE_NOTE).trim() || null;
  const active = input.active ?? true;
  const sortOrder = input.sortOrder ?? 0;

  const { data: existing, error: selectError } = await supabaseAdmin
    .from("marketplace_catalog_items")
    .select("id")
    .eq("external_url", externalUrl)
    .eq("purchase_mode", "external_affiliate")
    .maybeSingle();

  if (selectError) {
    return { ok: false, externalUrl, error: selectError.message };
  }

  const row = {
    title: input.title.trim(),
    description: input.description.trim(),
    price_cents: input.priceCents,
    shipping_cents: input.shippingCents,
    currency: input.currency.trim().toLowerCase(),
    image_urls: input.imageUrls,
    purchase_mode: "external_affiliate" as const,
    external_url: externalUrl,
    affiliate_note: affiliateNote,
    active,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabaseAdmin.from("marketplace_catalog_items").update(row).eq("id", existing.id);
    if (error) {
      return { ok: false, externalUrl, error: error.message };
    }
    return { ok: true, externalUrl, id: existing.id as string, created: false };
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("marketplace_catalog_items")
    .insert(row)
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    return { ok: false, externalUrl, error: insertError?.message ?? "insert failed" };
  }

  return { ok: true, externalUrl, id: inserted.id as string, created: true };
}

export async function upsertAffiliateCatalogItems(
  inputs: AffiliateCatalogUpsertInput[],
): Promise<{ results: AffiliateCatalogUpsertResult[] }> {
  const results: AffiliateCatalogUpsertResult[] = [];
  for (const input of inputs) {
    results.push(await upsertAffiliateCatalogItem(input));
  }
  return { results };
}
