import { NextResponse } from "next/server";

import { getEnv } from "@/lib/config/env";
import { runIngestionPipeline } from "@/lib/ingestion/pipeline";

function isAuthorized(request: Request): boolean {
  const env = getEnv();
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }
  return authHeader === `Bearer ${env.INGESTION_SHARED_SECRET}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runIngestionPipeline();
  return NextResponse.json({
    ok: true,
    results,
  });
}

