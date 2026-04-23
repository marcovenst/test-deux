import { NextResponse } from "next/server";

import { getActiveSelfServeAds } from "@/lib/ads/selfServe";

export async function GET() {
  try {
    const data = await getActiveSelfServeAds(3);
    return NextResponse.json({
      ok: true,
      count: data.length,
      data: data.map((item) => ({
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        targetUrl: item.targetUrl,
        description: item.description,
        businessName: item.businessName,
        endsAt: item.endsAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch active ads",
        data: [],
      },
      { status: 500 },
    );
  }
}
