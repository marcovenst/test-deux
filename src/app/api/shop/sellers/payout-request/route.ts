import { NextResponse } from "next/server";
import { z } from "zod";

import { createPayoutRequestFromSellerToken } from "@/lib/shop/marketplace";
import type { MarketplacePayoutMethod } from "@/lib/db/types";

const bodySchema = z.object({
  accessToken: z.string().min(24),
  amountCents: z.number().int().positive(),
  method: z.enum(["ach", "zelle", "debit_card"]),
  recipient: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payout request" }, { status: 400 });
  }

  try {
    const { payoutRequestId } = await createPayoutRequestFromSellerToken({
      accessToken: parsed.data.accessToken,
      amountCents: parsed.data.amountCents,
      method: parsed.data.method as MarketplacePayoutMethod,
      recipient: parsed.data.recipient,
    });
    return NextResponse.json({ ok: true, payoutRequestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout request failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
