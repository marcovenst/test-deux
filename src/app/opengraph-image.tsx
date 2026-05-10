import { ImageResponse } from "next/og";

import { PRODUCTION_SITE_URL, SITE_NAME } from "@/lib/seo/site";

export const runtime = "edge";

export const alt = `${SITE_NAME} — Nouvèl ak tandans Ayiti`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(145deg, #020617 0%, #0f172a 45%, #1e293b 100%)",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#f8fafc",
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: "#94a3b8",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Nouvèl, tandans, espò, ak kominote ayisyen — an dirèk.
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 26,
            color: "#64748b",
          }}
        >
          {PRODUCTION_SITE_URL.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...size },
  );
}
