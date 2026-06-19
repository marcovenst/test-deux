#!/usr/bin/env node
/**
 * Register QStash cron schedules (hourly pipeline + daily newsletter).
 * Loads optional .env.local for INGESTION_SHARED_SECRET and NEXT_PUBLIC_APP_URL.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.zenlakay.com").replace(/\/$/, "");
const secret = process.env.INGESTION_SHARED_SECRET?.trim() || "";

if (!secret) {
  console.error("Missing INGESTION_SHARED_SECRET in .env.local or shell.");
  process.exit(1);
}

const url = `${base}/api/jobs/schedule`;
console.error(`POST ${url} …`);

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
  body: "{}",
});

const text = await res.text();
console.log(text);
if (!res.ok) {
  console.error(`HTTP ${res.status}`);
  process.exit(1);
}
