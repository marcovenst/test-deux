import type { Platform } from "@/lib/db/types";

export type IngestionSource = {
  name: string;
  platform: Platform;
};

export type NormalizedPost = {
  id: string;
  title: string;
  content: string;
  source_name: string;
  source_url: string;
  platform: "news" | "reddit" | "youtube" | "twitter";
  published_at: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  language: "ht" | "fr" | "en";
  raw_metadata: Record<string, unknown>;
};

export type RawIngestionRecord = {
  externalId?: string | null;
  title?: string | null;
  content?: string | null;
  sourceUrl?: string | null;
  canonicalUrl?: string | null;
  publishedAt?: string | Date | null;
  language?: string | null;
  platform: Platform;
  engagement?: Partial<NormalizedPost["engagement"]>;
  metadata?: Record<string, unknown>;
};

export type SourceAdapter = {
  source: IngestionSource;
  fetchRecords: () => Promise<RawIngestionRecord[]>;
};

export type FeedSourceConfig = {
  url: string;
  sourceName: string;
};

export type ScrapeSourceConfig = {
  url: string;
  sourceName: string;
  articleSelector: string;
  titleSelector: string;
  contentSelector?: string;
  linkSelector?: string;
  timeSelector?: string;
};

