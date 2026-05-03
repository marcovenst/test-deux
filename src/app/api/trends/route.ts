import { NextResponse } from "next/server";

import { normalizeTrendCategory } from "@/lib/trends/categories";
import { normalizePopularityWindow } from "@/lib/trends/popularity";
import { getTrendFeed } from "@/lib/trends/query";

function normalizeCategory(input: string | null) {
  const normalized = normalizeTrendCategory(input, { defaultCategory: "all" });
  return normalized === "all" ? undefined : normalized;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") === "weekly" ? "weekly" : "daily";
  const category = normalizeCategory(searchParams.get("category"));
  const popularityWindow = normalizePopularityWindow(searchParams.get("popularityWindow"));

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

