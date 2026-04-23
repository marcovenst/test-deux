import { NextResponse } from "next/server";

import { getEnv } from "@/lib/config/env";
import { computeTrendScores } from "@/lib/trends/score";

type ScorePayload = {
  timeframe?: "daily" | "weekly";
};

function isAuthorized(request: Request): boolean {
  const env = getEnv();
  return request.headers.get("authorization") === `Bearer ${env.INGESTION_SHARED_SECRET}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ScorePayload;
  const timeframe = body.timeframe ?? "daily";
  const result = await computeTrendScores(timeframe);
  return NextResponse.json({
    ok: true,
    ...result,
  });
}

