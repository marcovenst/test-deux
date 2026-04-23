import { NextResponse } from "next/server";

import { readAdsOverrides, writeAdsOverrides } from "@/lib/ads/settings";
import type { AdsConfigOverrides } from "@/lib/ads/config";

function isAuthorized(request: Request) {
  const token = request.headers.get("x-admin-token");
  const expected = process.env.ADMIN_DASHBOARD_TOKEN ?? process.env.INGESTION_SHARED_SECRET;
  return Boolean(expected) && token === expected;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const overrides = await readAdsOverrides();
  return NextResponse.json({
    ok: true,
    overrides: overrides ?? {},
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as AdsConfigOverrides | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  await writeAdsOverrides(payload);
  return NextResponse.json({
    ok: true,
    saved: payload,
  });
}

