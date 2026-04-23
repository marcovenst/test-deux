import { NextResponse } from "next/server";

import { getEnv } from "@/lib/config/env";
import { setupQStashSchedules } from "@/lib/jobs/scheduler";

function isAuthorized(request: Request): boolean {
  const env = getEnv();
  return request.headers.get("authorization") === `Bearer ${env.INGESTION_SHARED_SECRET}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const schedules = await setupQStashSchedules();
    return NextResponse.json({
      ok: true,
      schedules,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to setup schedules",
      },
      { status: 400 },
    );
  }
}

