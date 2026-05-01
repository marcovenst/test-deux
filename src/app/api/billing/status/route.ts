import { NextResponse } from "next/server";

import { getUserIdFromHeaders } from "@/lib/billing/request";
import { getBillingStatus } from "@/lib/billing/subscriptions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryUserId = url.searchParams.get("userId");
  const headerUserId = getUserIdFromHeaders(request.headers);
  const userId = queryUserId ?? headerUserId;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Missing userId (query param or x-user-id header)" }, { status: 400 });
  }

  try {
    const status = await getBillingStatus(userId);
    return NextResponse.json({
      ok: true,
      data: status,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to resolve billing status" },
      { status: 500 },
    );
  }
}
