import { NextResponse } from "next/server";
import { z } from "zod";

import { adminMarkPayoutPaid } from "@/lib/shop/marketplace";

function isAuthorized(request: Request) {
  const token = request.headers.get("x-admin-token");
  const expected = process.env.ADMIN_DASHBOARD_TOKEN ?? process.env.INGESTION_SHARED_SECRET;
  return Boolean(expected) && token === expected;
}

const bodySchema = z.object({
  payoutRequestId: z.string().uuid(),
});

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  try {
    const result = await adminMarkPayoutPaid(parsed.data.payoutRequestId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 400 },
    );
  }
}
