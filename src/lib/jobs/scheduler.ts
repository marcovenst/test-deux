import { Client } from "@upstash/qstash";

import { getEnv, isConfigured } from "@/lib/config/env";

type ScheduleEntry = {
  destinationPath: string;
  cron: string;
};

/**
 * Evening pipeline on Hobby: Vercel cron can only run once/day, so this adds a second
 * `POST /api/jobs/pipeline` at 22:00 UTC. Morning run comes from `vercel.json` (10:00 UTC).
 * On Vercel Pro you may use `0 10,22 * * *` in vercel.json instead and skip this schedule.
 */
const SCHEDULES: ScheduleEntry[] = [
  { destinationPath: "/api/jobs/pipeline", cron: "0 22 * * *" },
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

