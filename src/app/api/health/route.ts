import { NextResponse } from "next/server";

import { getEnv, isConfigured } from "@/lib/config/env";
import { supabaseAdmin } from "@/lib/db/client";

type Check = {
  name: string;
  ok: boolean;
  message: string;
};

export async function GET() {
  const env = getEnv();
  const checks: Check[] = [
    {
      name: "supabase-url",
      ok: isConfigured(env.SUPABASE_URL),
      message: isConfigured(env.SUPABASE_URL)
        ? "configured"
        : "SUPABASE_URL is missing or placeholder",
    },
    {
      name: "supabase-service-role-key",
      ok: isConfigured(env.SUPABASE_SERVICE_ROLE_KEY),
      message: isConfigured(env.SUPABASE_SERVICE_ROLE_KEY)
        ? "configured"
        : "SUPABASE_SERVICE_ROLE_KEY is missing or placeholder",
    },
    {
      name: "ingestion-shared-secret",
      ok: isConfigured(env.INGESTION_SHARED_SECRET),
      message: isConfigured(env.INGESTION_SHARED_SECRET)
        ? "configured"
        : "INGESTION_SHARED_SECRET is missing or placeholder",
    },
    {
      name: "anthropic",
      ok: isConfigured(env.ANTHROPIC_API_KEY),
      message: isConfigured(env.ANTHROPIC_API_KEY)
        ? "configured"
        : "ANTHROPIC_API_KEY missing; summaries will be skipped",
    },
    {
      name: "youtube",
      ok: isConfigured(env.YOUTUBE_API_KEY),
      message: isConfigured(env.YOUTUBE_API_KEY)
        ? "configured"
        : "YOUTUBE_API_KEY missing; YouTube ingestion disabled",
    },
    {
      name: "reddit",
      ok: isConfigured(env.REDDIT_CLIENT_ID) && isConfigured(env.REDDIT_CLIENT_SECRET),
      message:
        isConfigured(env.REDDIT_CLIENT_ID) && isConfigured(env.REDDIT_CLIENT_SECRET)
          ? "configured"
          : "Reddit credentials missing; Reddit ingestion disabled",
    },
    {
      name: "apify",
      ok: isConfigured(env.APIFY_TOKEN) && isConfigured(env.APIFY_ACTOR_ID),
      message:
        isConfigured(env.APIFY_TOKEN) && isConfigured(env.APIFY_ACTOR_ID)
          ? "configured"
          : "Apify credentials missing; X ingestion disabled",
    },
    {
      name: "apify-instagram",
      ok: isConfigured(env.APIFY_TOKEN) && isConfigured(env.APIFY_INSTAGRAM_ACTOR_ID),
      message:
        isConfigured(env.APIFY_TOKEN) && isConfigured(env.APIFY_INSTAGRAM_ACTOR_ID)
          ? "configured"
          : "Apify Instagram actor missing; Instagram ingestion disabled",
    },
    {
      name: "apify-tiktok",
      ok: isConfigured(env.APIFY_TOKEN) && isConfigured(env.APIFY_TIKTOK_ACTOR_ID),
      message:
        isConfigured(env.APIFY_TOKEN) && isConfigured(env.APIFY_TIKTOK_ACTOR_ID)
          ? "configured"
          : "Apify TikTok actor missing; TikTok ingestion disabled",
    },
    {
      name: "apify-facebook",
      ok: isConfigured(env.APIFY_TOKEN) && isConfigured(env.APIFY_FACEBOOK_ACTOR_ID),
      message:
        isConfigured(env.APIFY_TOKEN) && isConfigured(env.APIFY_FACEBOOK_ACTOR_ID)
          ? "configured"
          : "Apify Facebook actor missing; Facebook ingestion disabled",
    },
    {
      name: "qstash",
      ok: isConfigured(env.UPSTASH_QSTASH_TOKEN),
      message: isConfigured(env.UPSTASH_QSTASH_TOKEN)
        ? "configured"
        : "UPSTASH_QSTASH_TOKEN missing; cron schedule setup disabled",
    },
  ];

  let dbReachable = false;
  try {
    const { error } = await supabaseAdmin.from("clusters").select("id", { count: "exact", head: true });
    dbReachable = !error;
  } catch {
    dbReachable = false;
  }

  checks.push({
    name: "database-connection",
    ok: dbReachable,
    message: dbReachable ? "reachable" : "cannot query Supabase",
  });

  const ok = checks.every(
    (item) =>
      item.ok ||
      item.name === "anthropic" ||
      item.name === "youtube" ||
      item.name === "reddit" ||
      item.name === "apify" ||
      item.name === "apify-facebook" ||
      item.name === "apify-instagram" ||
      item.name === "apify-tiktok" ||
      item.name === "qstash",
  );

  return NextResponse.json(
    {
      ok,
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
