import { Client } from "@upstash/qstash";

import { getEnv, isConfigured } from "@/lib/config/env";

type ScheduleEntry = {
  destinationPath: string;
  cron: string;
};

/**
 * Full pipeline every 2 hours via QStash (ingest → cluster → score → summarize).
 * Vercel Cron in `vercel.json` uses the same cadence for zenlakay.com.
 * After changing this list, run `pnpm schedules:setup` (or POST /api/jobs/schedule) once.
 */
const SCHEDULES: ScheduleEntry[] = [
  { destinationPath: "/api/jobs/pipeline", cron: "0 */2 * * *" },
  { destinationPath: "/api/jobs/newsletter", cron: "0 13 * * *" },
];

export async function setupQStashSchedules() {
  const env = getEnv();
  if (!isConfigured(env.UPSTASH_QSTASH_TOKEN)) {
    throw new Error("UPSTASH_QSTASH_TOKEN is not configured");
  }
  if (!isConfigured(env.NEXT_PUBLIC_APP_URL)) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  const client = new Client({
    token: env.UPSTASH_QSTASH_TOKEN,
  });

  const appOrigin = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const existing = await client.schedules.list();
  for (const schedule of existing) {
    const destination = schedule.destination ?? "";
    const isOurs = SCHEDULES.some((entry) => destination.includes(entry.destinationPath));
    if (isOurs && schedule.scheduleId) {
      await client.schedules.delete(schedule.scheduleId);
    }
  }

  const results: Array<{ destinationPath: string; scheduleId: string }> = [];

  for (const schedule of SCHEDULES) {
    const destination = `${appOrigin}${schedule.destinationPath}`;
    const response = await client.schedules.create({
      destination,
      cron: schedule.cron,
      method: "POST",
      headers: {
        authorization: `Bearer ${env.INGESTION_SHARED_SECRET}`,
      },
      body: JSON.stringify({ timeframe: "daily" }),
    });
    results.push({
      destinationPath: schedule.destinationPath,
      scheduleId: response.scheduleId,
    });
  }

  return results;
}

