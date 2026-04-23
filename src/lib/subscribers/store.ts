import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { supabaseAdmin } from "@/lib/db/client";
import type { SubscribeInput, SubscriberRecord } from "@/lib/subscribers/types";

const DATA_DIR = path.join(process.cwd(), "data");
const JSONL_PATH = path.join(DATA_DIR, "subscribers.jsonl");
const CSV_PATH = path.join(DATA_DIR, "subscribers.csv");

function toCsvValue(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function ensureFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.appendFile(JSONL_PATH, "", "utf8");
  try {
    await fs.access(CSV_PATH);
  } catch {
    const header =
      "id,full_name,contact_channel,email,phone,interests,keywords,notify_realtime,created_at\n";
    await fs.writeFile(CSV_PATH, header, "utf8");
  }
}

async function appendSubscriberFiles(record: SubscriberRecord) {
  await ensureFiles();
  await fs.appendFile(JSONL_PATH, `${JSON.stringify(record)}\n`, "utf8");
  const csvRow = [
    record.id,
    toCsvValue(record.fullName),
    record.contactChannel,
    record.email ?? "",
    record.phone ?? "",
    toCsvValue(record.interests.join("|")),
    toCsvValue(record.keywords.join("|")),
    record.notifyRealtime ? "true" : "false",
    record.createdAt,
  ].join(",");
  await fs.appendFile(CSV_PATH, `${csvRow}\n`, "utf8");
}

export async function saveSubscriber(input: SubscribeInput): Promise<SubscriberRecord> {
  const now = new Date().toISOString();
  let subscriberId: string = randomUUID();

  try {
    const { data: existing } = await supabaseAdmin
      .from("subscribers")
      .select("id")
      .or(
        input.contactChannel === "email"
          ? `email.eq.${input.email}`
          : `phone.eq.${input.phone}`,
      )
      .maybeSingle();

    if (existing?.id) {
      subscriberId = existing.id as string;
      await supabaseAdmin
        .from("subscribers")
        .update({
          full_name: input.fullName,
          email: input.email ?? null,
          phone: input.phone ?? null,
          notify_realtime: input.notifyRealtime,
          is_active: true,
          updated_at: now,
        })
        .eq("id", subscriberId);
    } else {
      const { data: inserted } = await supabaseAdmin
        .from("subscribers")
        .insert({
          id: subscriberId,
          full_name: input.fullName,
          email: input.email ?? null,
          phone: input.phone ?? null,
          contact_channel: input.contactChannel,
          notify_realtime: input.notifyRealtime,
        })
        .select("id")
        .maybeSingle();
      if (inserted?.id) {
        subscriberId = inserted.id as string;
      }
    }

    await supabaseAdmin
      .from("subscriber_interests")
      .delete()
      .eq("subscriber_id", subscriberId);

    const categories = input.interests.map((interest) => ({
      subscriber_id: subscriberId,
      category: interest.toLowerCase(),
      keyword: null,
    }));
    const keywords = input.keywords.map((keyword) => ({
      subscriber_id: subscriberId,
      category: "keyword",
      keyword: keyword.toLowerCase(),
    }));
    const interestsRows = [...categories, ...keywords];
    if (interestsRows.length > 0) {
      await supabaseAdmin.from("subscriber_interests").insert(interestsRows);
    }
  } catch {
    // Continue even when database is unavailable; file storage remains the fallback source.
  }

  const record: SubscriberRecord = {
    id: subscriberId,
    fullName: input.fullName,
    contactChannel: input.contactChannel,
    email: input.email ?? null,
    phone: input.phone ?? null,
    interests: input.interests,
    keywords: input.keywords,
    notifyRealtime: input.notifyRealtime,
    createdAt: now,
  };
  await appendSubscriberFiles(record);
  return record;
}

export async function listSubscribersFromFile(): Promise<SubscriberRecord[]> {
  await ensureFiles();
  const raw = await fs.readFile(JSONL_PATH, "utf8");
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const output: SubscriberRecord[] = [];
  for (const line of lines) {
    try {
      output.push(JSON.parse(line) as SubscriberRecord);
    } catch {
      continue;
    }
  }
  return output;
}

