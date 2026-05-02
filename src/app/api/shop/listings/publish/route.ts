import { NextResponse } from "next/server";
import { z } from "zod";

import { createActiveListingWithSeller } from "@/lib/shop/marketplace";

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

  try {
    const { listingId, sellerAccessToken } = await createActiveListingWithSeller({
      sellerName: parsed.data.sellerName,
      sellerEmail: parsed.data.sellerEmail,
      sellerPhone: parsed.data.sellerPhone || undefined,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      priceCents: parsed.data.priceCents,
      shippingCents: parsed.data.shippingCents,
      imageUrls: parsed.data.imageUrls,
    });

    return NextResponse.json({
      ok: true,
      listingId,
      sellerAccessToken,
      dashboardUrl: `/shop-la-caille/seller/${sellerAccessToken}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to publish listing",
      },
      { status: 500 },
    );
  }
}
