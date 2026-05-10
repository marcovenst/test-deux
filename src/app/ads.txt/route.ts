import { NextResponse } from "next/server";

const ADSENSE_CERT_AUTHORITY_ID = "f08c47fec0942fa0";

function normalizeLines(body: string) {
  return body
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .join("\n");
}

function adsTxtFromClientId(clientId: string): string | null {
  const trimmed = clientId.trim();
  const m = /^ca-(pub-\d+)$/i.exec(trimmed);
  if (!m) {
    return null;
  }
  return `google.com, ${m[1]}, DIRECT, ${ADSENSE_CERT_AUTHORITY_ID}`;
}

/**
 * Serves `/ads.txt` for Google AdSense (and partners).
 * Production URL: https://zenlakay.com/ads.txt
 * Prefer `ADS_TXT_CONTENT` when you need multiple lines or non-Google entries.
 */
export async function GET() {
  const override = process.env.ADS_TXT_CONTENT?.trim();
  if (override) {
    return new NextResponse(`${normalizeLines(override)}\n`, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID ?? "";
  const line = adsTxtFromClientId(clientId);
  if (line) {
    return new NextResponse(`${line}\n`, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new NextResponse("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
