import { NextResponse } from "next/server";

import { searchArchivedClusters } from "@/lib/trends/archive";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limitParam = Number(searchParams.get("limit") ?? 40);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 120) : 40;
  if (!q) {
    return NextResponse.json({ query: q, count: 0, data: [] });
  }

  const archiveData = await searchArchivedClusters(q, limit);
  const data = archiveData.map((item) => ({
    clusterId: item.id,
    title: item.title,
    trendCategory: item.trendCategory,
    status: item.status,
    firstSeenAt: item.firstSeenAt,
    lastSeenAt: item.lastSeenAt,
    summary: item.summary,
    tags: item.tags,
  }));

  return NextResponse.json(
    {
      query: q,
      count: data.length,
      data,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
      },
    },
  );
}

