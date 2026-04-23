import { NextResponse } from "next/server";

import { getTrendFeed } from "@/lib/trends/query";

const ALLOWED_CATEGORIES = new Set([
  "all",
  "general",
  "politics",
  "music",
  "disaster",
  "diaspora",
  "sports",
  "culture",
  "community",
  "immigration",
]);

function normalizeCategory(input: string | null) {
  if (!input) {
    return undefined;
  }
  const value = input.trim().toLowerCase();
  const mapped =
    value === "jeneral"
      ? "general"
      : value === "espò" || value === "espo"
        ? "sports"
        : value === "imigrasyon"
          ? "immigration"
          : value === "kilti"
            ? "culture"
            : value === "kominote"
              ? "community"
              : value === "dezas"
                ? "disaster"
                : value === "mizik"
                  ? "music"
                  : value === "dyaspora"
                    ? "diaspora"
                    : value;
  return ALLOWED_CATEGORIES.has(mapped) ? mapped : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") === "weekly" ? "weekly" : "daily";
  const category = normalizeCategory(searchParams.get("category"));
  const popularityWindow =
    searchParams.get("popularityWindow") === "1h" ||
    searchParams.get("popularityWindow") === "5h"
      ? (searchParams.get("popularityWindow") as "1h" | "5h")
      : "24h";

  const data = await getTrendFeed(timeframe, category, popularityWindow);

  return NextResponse.json(
    {
      timeframe,
      popularityWindow,
      count: data.length,
      data,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}

