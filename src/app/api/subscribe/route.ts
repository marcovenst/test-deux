import { NextResponse } from "next/server";

import { saveSubscriber } from "@/lib/subscribers/store";
import { subscribeSchema } from "@/lib/subscribers/types";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid subscription payload",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const subscriber = await saveSubscriber(parsed.data);
  return NextResponse.json({
    ok: true,
    subscriber,
  });
}

