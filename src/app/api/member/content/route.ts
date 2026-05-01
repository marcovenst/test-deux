import { NextResponse } from "next/server";

import { getUserIdFromHeaders } from "@/lib/billing/request";
import { ensureActiveSubscription } from "@/lib/billing/subscriptions";

export async function GET(request: Request) {
  const userId = getUserIdFromHeaders(request.headers);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Missing x-user-id header" }, { status: 401 });
  }

  try {
    const allowed = await ensureActiveSubscription(userId);
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Active subscription required for member content" },
        { status: 402 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        message: "Member access granted",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to resolve entitlement" },
      { status: 500 },
    );
  }
}
