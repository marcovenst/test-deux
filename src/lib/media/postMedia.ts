type RawMetadata = Record<string, unknown> | null | undefined;

export type PostMedia = {
  imageUrl?: string;
  videoUrl?: string;
  embedUrl?: string;
  kind: "none" | "image" | "video" | "embed";
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getYouTubeIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").trim() || null;
    }
  } catch {
    return null;
  }
  return null;
}

function getTikTokVideoIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.replace(/^www\./, "").includes("tiktok.com")) {
      return null;
    }
    const m = parsed.pathname.match(/\/video\/(\d+)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function getTwitterStatusIdFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (!host.includes("twitter.com") && !host.includes("x.com")) {
      return null;
    }
    const m = new URL(url).pathname.match(/\/status\/(\d+)/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function getInstagramEmbedFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("instagram.com")) {
      return null;
    }
    const m = parsed.pathname.match(/\/(p|reel|tv)\/([^/]+)/i);
    if (!m) return null;
    const shortcode = m[2];
    const kind = m[1].toLowerCase();
    if (kind === "reel" || kind === "tv") {
      return `https://www.instagram.com/${kind}/${encodeURIComponent(shortcode)}/embed/captioned/?cr=1&v=14`;
    }
    return `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/embed/captioned/?cr=1&v=14`;
  } catch {
    return null;
  }
}

function getFacebookVideoEmbedFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (!host.includes("facebook.com") && !host.includes("fb.watch")) {
      return null;
    }
    if (!/\/(videos|watch|reel)\//i.test(parsed.pathname) && !host.includes("fb.watch")) {
      return null;
    }
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=476`;
  } catch {
    return null;
  }
}

function fromMetadata(metadata: RawMetadata, key: string): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }
  return asString(metadata[key]);
}

export function extractPostMedia(input: {
  sourceUrl: string;
  platform?: string;
  rawMetadata?: RawMetadata;
}): PostMedia {
  const sourceUrl = input.sourceUrl;
  const platform = (input.platform ?? "").toLowerCase();
  const metadata = input.rawMetadata;

  const youtubeId =
    getYouTubeIdFromUrl(sourceUrl) ??
    (/youtube\.com|youtu\.be/i.test(sourceUrl) || platform.includes("youtube")
      ? fromMetadata(metadata, "videoId")
      : null);
  if (youtubeId) {
    return {
      kind: "embed",
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  const tiktokId =
    fromMetadata(metadata, "tiktokVideoId") ?? getTikTokVideoIdFromUrl(sourceUrl);
  if (tiktokId && /^\d{10,}$/.test(tiktokId)) {
    return {
      kind: "embed",
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokId}`,
    };
  }

  const tweetId =
      fromMetadata(metadata, "tweetId") ??
      fromMetadata(metadata, "tweet_id") ??
      getTwitterStatusIdFromUrl(sourceUrl);
  if (tweetId && /^\d+$/.test(tweetId)) {
    return {
      kind: "embed",
      embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${encodeURIComponent(tweetId)}`,
    };
  }

  const instagramEmbed = getInstagramEmbedFromUrl(sourceUrl);
  if (instagramEmbed) {
    return {
      kind: "embed",
      embedUrl: instagramEmbed,
    };
  }

  const fbVideo = getFacebookVideoEmbedFromUrl(sourceUrl);
  if (fbVideo) {
    return {
      kind: "embed",
      embedUrl: fbVideo,
    };
  }

  const directVideo =
    fromMetadata(metadata, "videoUrl") ??
    fromMetadata(metadata, "video_url") ??
    (/\.(mp4|webm|ogg)(\?|$)/i.test(sourceUrl) ? sourceUrl : null);
  if (directVideo) {
    return {
      kind: "video",
      videoUrl: directVideo,
    };
  }

  const imageUrl =
    fromMetadata(metadata, "thumbnailUrl") ??
    fromMetadata(metadata, "imageUrl") ??
    fromMetadata(metadata, "image_url") ??
    fromMetadata(metadata, "displayUrl") ??
    fromMetadata(metadata, "coverUrl");
  if (imageUrl) {
    return {
      kind: "image",
      imageUrl,
    };
  }

  return { kind: "none" };
}
