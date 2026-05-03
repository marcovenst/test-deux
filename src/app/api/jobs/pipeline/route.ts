import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getEnv, isConfigured } from "@/lib/config/env";
import { runFullPipeline } from "@/lib/jobs/pipeline";

/** Ingest + cluster + score + summarize can exceed the default 10s on Vercel Hobby. */
export const maxDuration = 300;

function bearer(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }
  return auth.slice("Bearer ".length);
}

function isAuthorizedPost(request: Request): boolean {
  const env = getEnv();
  const token = bearer(request);
  if (!token) {
    return false;
  }
  if (token === env.INGESTION_SHARED_SECRET) {
    return true;
  }
  return isConfigured(env.CRON_SECRET) && token === env.CRON_SECRET;
}

function isAuthorizedCronGet(request: Request): boolean {
  const env = getEnv();
  if (!isConfigured(env.CRON_SECRET)) {
    return false;
  }
  return bearer(request) === env.CRON_SECRET;
}

async function runAndRespond() {
  const result = await runFullPipeline();
  try {
    revalidatePath("/", "page");
    revalidatePath("/news", "page");
    revalidatePath("/search", "page");
    revalidatePath("/cluster/[id]", "page");
  } catch (error) {
    console.warn("[jobs/pipeline] revalidatePath failed", error);
  }
  return NextResponse.json({ ok: true, ...result });
}

/** Vercel Cron invokes this route with GET when `vercel.json` crons are configured. */
export async function GET(request: Request) {
  if (!isAuthorizedCronGet(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runAndRespond();
}

export async function POST(request: Request) {
  if (!isAuthorizedPost(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runAndRespond();
}

