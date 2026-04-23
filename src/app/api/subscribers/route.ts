import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

import { listSubscribersFromFile } from "@/lib/subscribers/store";

function isAuthorized(request: Request) {
  const secret = process.env.INGESTION_SHARED_SECRET;
  if (!secret) {
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("format") === "csv") {
    const csvPath = path.join(process.cwd(), "data", "subscribers.csv");
    const csv = await fs.readFile(csvPath, "utf8").catch(() => "");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  const subscribers = await listSubscribersFromFile();
  return NextResponse.json({
    ok: true,
    count: subscribers.length,
    subscribers,
  });
}

