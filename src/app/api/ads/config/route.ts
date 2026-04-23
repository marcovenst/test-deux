import { NextResponse } from "next/server";

import { getEffectiveAdsConfig } from "@/lib/ads/settings";

export async function GET() {
  const config = await getEffectiveAdsConfig();
  return NextResponse.json({
    ok: true,
    config,
  });
}

