import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/db/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REACTIONS = new Set(["sa_raz", "sa_komik", "sa_enteresan"]);

type ReactionPayload = {
  voterId?: string;
  reaction?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ ok: false, error: "invalid-cluster-id" }, { status: 400 });
  }

  let payload: ReactionPayload;
  try {
    payload = (await request.json()) as ReactionPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }

  const voterId = (payload.voterId ?? "").trim();
  const reaction = (payload.reaction ?? "").trim();
  if (!voterId || voterId.length > 120) {
    return NextResponse.json({ ok: false, error: "invalid-voter-id" }, { status: 400 });
  }
  if (!REACTIONS.has(reaction)) {
    return NextResponse.json({ ok: false, error: "invalid-reaction" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc("upsert_cluster_reaction", {
    p_cluster_id: id,
    p_voter_id: voterId,
    p_reaction: reaction,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "reaction-upsert-failed" }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    ok: true,
    clusterId: id,
    selectedReaction: row?.selected_reaction ?? reaction,
    totals: {
      saRaz: Number(row?.sa_raz_count ?? 0),
      saKomik: Number(row?.sa_komik_count ?? 0),
      saEnteresan: Number(row?.sa_enteresan_count ?? 0),
      totalVotes: Number(row?.total_votes ?? 0),
    },
  });
}
