#!/usr/bin/env node
/**
 * Remove duplicate QStash schedules, then register the current hourly pipeline + newsletter.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@upstash/qstash";

function loadDotEnvOptional(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnvOptional(resolve(process.cwd(), ".env.local"));

const token = process.env.UPSTASH_QSTASH_TOKEN?.trim() || "";
if (!token) {
  console.error("Missing UPSTASH_QSTASH_TOKEN in .env.local or shell.");
  process.exit(1);
}

const client = new Client({ token });
const existing = await client.schedules.list();
console.error(`Found ${existing.length} schedule(s).`);

for (const schedule of existing) {
  const id = schedule.scheduleId;
  if (!id) continue;
  await client.schedules.delete(id);
  console.error(`Deleted ${id} (${schedule.cron ?? "?"})`);
}

console.error("Re-registering schedules via /api/jobs/schedule …");
const { spawnSync } = await import("node:child_process");
const result = spawnSync("node", ["scripts/setup-schedules.mjs"], {
  stdio: "inherit",
  cwd: process.cwd(),
});
process.exit(result.status ?? 1);
