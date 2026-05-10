import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getEnv, isConfigured } from "@/lib/config/env";
import { upsertAffiliateCatalogItems } from "@/lib/shop/catalogAdmin";

function isAuthorized(request: Request): boolean {
  const header = request.headers.get("x-admin-token");
  const env = getEnv();
  const candidates = [env.ADMIN_DASHBOARD_TOKEN, env.INGESTION_SHARED_SECRET].filter(isConfigured);
  return Boolean(header && candidates.some((t) => t === header));
}

const itemSchema = z.object({
  externalUrl: z.string().url(),
  title: z.string().min(1).max(500),
  description: z.string().max(8000).default(""),
  priceCents: z.number().int().min(1).max(100_000_000),
  shippingCents: z.number().int().min(0).max(100_000_000).default(0),
  currency: z.string().length(3).default("usd"),
  imageUrls: z.array(z.string().url()).min(1).max(12),
  affiliateNote: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
});

/** Upsert curated affiliate catalog rows (e.g. Amazon) matched by `externalUrl`. Service-role only. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { results } = await upsertAffiliateCatalogItems(
    parsed.data.items.map((i) => ({
      externalUrl: i.externalUrl,
      title: i.title,
      description: i.description,
      priceCents: i.priceCents,
      shippingCents: i.shippingCents,
      currency: i.currency,
      imageUrls: i.imageUrls,
      affiliateNote: i.affiliateNote,
      active: i.active,
      sortOrder: i.sortOrder,
    })),
  );

  const failed = results.filter((r) => !r.ok);
  try {
    revalidatePath("/shop-la-caille/ashti", "page");
  } catch (e) {
    console.warn("[admin/catalog/items] revalidatePath failed", e);
  }

  return NextResponse.json({
    ok: failed.length === 0,
    results,
    errors: failed,
  });
}
