import { NextResponse } from "next/server";

import { getEnv } from "@/lib/config/env";
import { runSummarizationJob } from "@/lib/summarization/claude";

function isAuthorized(request: Request): boolean {
  const env = getEnv();
  return request.headers.get("authorization") === `Bearer ${env.INGESTION_SHARED_SECRET}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedLimit =
    typeof body?.limit === "number" && Number.isFinite(body.limit) ? body.limit : 20;
  const result = await runSummarizationJob(requestedLimit);
  return NextResponse.json({
    ok: true,
    limit: requestedLimit,
    ...result,
  });
}

