import { NextResponse } from "next/server";

import { sendDailySubscriberDigest } from "@/lib/subscribers/notify";

function isAuthorized(request: Request) {
  const secret = process.env.INGESTION_SHARED_SECRET;
  if (!secret) {
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendDailySubscriberDigest();
  return NextResponse.json({
    ok: true,
    mode: "daily_digest",
    ...result,
  });
}
