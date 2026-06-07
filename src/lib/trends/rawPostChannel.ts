/**
 * Stable “channel” key for scoring diversity: X / TikTok / Instagram / Facebook / YouTube
 * vs generic `platform` (Apify social posts are all stored as `twitter` in DB).
 */
export function rawPostChannelKey(input: {
  platform: string;
  raw_metadata?: unknown;
  source_url?: string | null;
}): string {
  const meta =
    input.raw_metadata && typeof input.raw_metadata === "object"
      ? (input.raw_metadata as Record<string, unknown>)
      : null;
  const network = typeof meta?.network === "string" ? meta.network.toLowerCase().trim() : "";
  if (network === "x" || network === "instagram" || network === "tiktok" || network === "facebook") {
    return network;
  }

  const url = (input.source_url ?? "").toLowerCase();
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com")) {
    return "facebook";
  }
  if (url.includes("twitter.com") || url.includes("x.com")) return "x";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";

  const p = (input.platform ?? "").toLowerCase();
  if (p.includes("youtube")) return "youtube";
  if (p.includes("reddit")) return "reddit";
  if (p.includes("twitter")) return "x";
  return p || "unknown";
}

export function socialAuthoringUrlPattern(): RegExp {
  return /tiktok\.com|instagram\.com|twitter\.com|x\.com|facebook\.com|fb\.watch/i;
}
