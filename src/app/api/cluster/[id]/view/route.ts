import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/db/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ ok: false, error: "invalid-cluster-id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc("increment_cluster_view", {
    p_cluster_id: id,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "increment-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, clusterId: id, totalViews: Number(data ?? 0) });
}
