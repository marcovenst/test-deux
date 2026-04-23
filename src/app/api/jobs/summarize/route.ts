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

  const result = await runSummarizationJob();
  return NextResponse.json({
    ok: true,
    ...result,
  });
}

