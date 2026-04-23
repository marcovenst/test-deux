import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/db/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PlayPayload = {
  plays?: number;
  durationSeconds?: number;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ ok: false, error: "invalid-cluster-id" }, { status: 400 });
  }

  let payload: PlayPayload = {};
  try {
    payload = (await request.json()) as PlayPayload;
  } catch {
    payload = {};
  }

  const plays = Math.max(0, Math.min(5, Math.floor(payload.plays ?? 1)));
  const durationSeconds = Math.max(0, Math.min(1800, Number(payload.durationSeconds ?? 0)));

  const { data, error } = await supabaseAdmin.rpc("increment_cluster_play_metrics", {
    p_cluster_id: id,
    p_plays: plays,
    p_play_seconds: durationSeconds,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "play-track-failed" }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    ok: true,
    clusterId: id,
    totals: {
      totalPlays: Number(row?.total_plays ?? 0),
      totalPlaySeconds: Number(row?.total_play_seconds ?? 0),
      averagePlaySeconds: Number(row?.average_play_seconds ?? 0),
    },
  });
}
