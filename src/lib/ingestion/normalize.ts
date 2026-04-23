import crypto from "node:crypto";

import type { RawPostRow } from "@/lib/db/types";
import type { IngestionSource, NormalizedPost, RawIngestionRecord } from "@/lib/ingestion/types";

const MIN_CONTENT_LENGTH = 20;

function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeDate(value?: string | Date | null): string {
  if (!value) {
    return new Date().toISOString();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function normalizeLanguage(input?: string | null): "ht" | "fr" | "en" {
  if (!input) {
    return "en";
  }
  const value = input.toLowerCase();
  if (value.startsWith("ht") || value.includes("kreyol")) {
    return "ht";
  }
  if (value.startsWith("fr")) {
    return "fr";
  }
  return "en";
}

function normalizeEngagement(engagement: RawIngestionRecord["engagement"]): NormalizedPost["engagement"] {
  return {
    likes: Math.max(0, engagement?.likes ?? 0),
    shares: Math.max(0, engagement?.shares ?? 0),
    comments: Math.max(0, engagement?.comments ?? 0),
    views: Math.max(0, engagement?.views ?? 0),
  };
}

function truncateContent(content: string): string {
  if (content.length <= 8000) {
    return content;
  }
  return content.slice(0, 8000);
}

export function normalizeRecord(
  record: RawIngestionRecord,
  source: IngestionSource,
): (NormalizedPost & { externalId?: string | null; canonicalUrl?: string | null }) | null {
  const title = (record.title ?? "").trim();
  const content = (record.content ?? "").trim();
  const sourceUrl = (record.sourceUrl ?? record.canonicalUrl ?? "").trim();

  if (!title || !sourceUrl) {
    return null;
  }

  const preparedContent = content || title;
  if (preparedContent.length < MIN_CONTENT_LENGTH) {
    return null;
  }

  const publishedAt = safeDate(record.publishedAt);
  const idSeed = `${record.platform}:${record.externalId ?? sourceUrl}:${title}`;

  return {
    id: hashValue(idSeed),
    title,
    content: truncateContent(preparedContent),
    source_name: source.name,
    source_url: sourceUrl,
    platform: record.platform === "web" ? "news" : (record.platform as NormalizedPost["platform"]),
    published_at: publishedAt,
    engagement: normalizeEngagement(record.engagement),
    language: normalizeLanguage(record.language),
    raw_metadata: record.metadata ?? {},
    externalId: record.externalId ?? null,
    canonicalUrl: record.canonicalUrl ?? sourceUrl,
  };
}

export function computeContentFingerprint(title: string, content: string): string {
  const normalized = `${title.toLowerCase().trim()}|${content
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()}`;
  return hashValue(normalized);
}

export function computeCanonicalUrlHash(url?: string | null): string | null {
  if (!url) {
    return null;
  }
  return hashValue(url.trim().toLowerCase());
}

export function normalizedPostToRawPostRow(
  normalized: ReturnType<typeof normalizeRecord>,
): Partial<RawPostRow> | null {
  if (!normalized) {
    return null;
  }

  return {
    external_id: normalized.externalId ?? null,
    title: normalized.title,
    content: normalized.content,
    snippet: normalized.content.slice(0, 280),
    source_name: normalized.source_name,
    source_url: normalized.source_url,
    canonical_url: normalized.canonicalUrl ?? null,
    canonical_url_hash: computeCanonicalUrlHash(normalized.canonicalUrl),
    content_fingerprint: computeContentFingerprint(normalized.title, normalized.content),
    platform: normalized.platform,
    published_at: normalized.published_at,
    language: normalized.language,
    engagement: normalized.engagement,
    raw_metadata: normalized.raw_metadata,
    is_deleted: false,
  };
}

