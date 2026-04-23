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

  const videoId = fromMetadata(metadata, "videoId") ?? getYouTubeIdFromUrl(sourceUrl);
  if (platform.includes("youtube") || videoId) {
    if (videoId) {
      return {
        kind: "embed",
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
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
    fromMetadata(metadata, "image_url");
  if (imageUrl) {
    return {
      kind: "image",
      imageUrl,
    };
  }

  return { kind: "none" };
}
