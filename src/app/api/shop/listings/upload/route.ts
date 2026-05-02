import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/db/client";

const BUCKET = "shop-listings";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ ok: false, error: "Only JPEG, PNG, WebP, or GIF images" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Image too large (max 5MB)" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "image";
  const path = `uploads/${randomUUID()}-${safeName}`;

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Upload failed" },
      { status: 500 },
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) {
    return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 503 });
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${data.path}`;

  return NextResponse.json({ ok: true, url: publicUrl, path: data.path });
}
