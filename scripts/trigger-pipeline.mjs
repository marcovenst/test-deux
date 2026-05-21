#!/usr/bin/env node
/**
 * Trigger POST /api/jobs/pipeline on your deployed site (or local dev).
 * Loads optional .env.local so you don't have to export secrets manually.
 *
 * Requires INGESTION_SHARED_SECRET or CRON_SECRET in env (same Bearer as cron uses for GET).
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

const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://zenlakay.com").replace(/\/$/, "");
const secret =
  process.env.INGESTION_SHARED_SECRET?.trim() || process.env.CRON_SECRET?.trim() || "";

if (!secret) {
  console.error(
    "Missing INGESTION_SHARED_SECRET or CRON_SECRET. Add one to .env.local or export it in your shell.",
  );
  process.exit(1);
}

const url = `${base}/api/jobs/pipeline`;
console.error(`POST ${url} (timeout ~5 min) …`);

let res;
try {
  res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: "{}",
    signal: AbortSignal.timeout(310_000),
  });
} catch (e) {
  console.error(String(e.message ?? e));
  process.exit(1);
}

const text = await res.text();
console.log(text);
if (!res.ok) {
  console.error(`HTTP ${res.status}`);
  process.exit(1);
}
