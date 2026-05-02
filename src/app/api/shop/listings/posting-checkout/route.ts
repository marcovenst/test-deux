import { NextResponse } from "next/server";

/** @deprecated Listings are published via POST /api/shop/listings/publish (no upfront posting fee). */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Frè pibliyasyon 99¢ pa itilize ankò. Itilize /api/shop/listings/publish pou mete atik an aktif san peman anvan.",
    },
    { status: 410 },
  );
}
