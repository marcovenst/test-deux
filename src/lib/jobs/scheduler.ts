import { Client } from "@upstash/qstash";

import { getEnv, isConfigured } from "@/lib/config/env";

type ScheduleEntry = {
  destinationPath: string;
  cron: string;
};

/**
 * Hourly ingestion via QStash. Vercel Hobby cron stays once/day in `vercel.json` as a backup.
 * After changing this list, run `pnpm schedules:setup` (or POST /api/jobs/schedule) once.
 */
const SCHEDULES: ScheduleEntry[] = [
  { destinationPath: "/api/jobs/pipeline", cron: "5 * * * *" },
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

  const results: Array<{ destinationPath: string; scheduleId: string }> = [];

  for (const schedule of SCHEDULES) {
    const destination = `${env.NEXT_PUBLIC_APP_URL}${schedule.destinationPath}`;
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

