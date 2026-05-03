import googleTrends from "google-trends-api";

type PopularityWindow = "1h" | "5h" | "24h";

const STOP_WORDS = new Set([
  "ak",
  "nan",
  "sou",
  "pou",
  "yon",
  "ki",
  "yo",
  "se",
  "nou",
  "li",
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "haiti",
  "ayiti",
  "haitian",
]);

const trendsCache = new Map<string, { value: number; expiresAt: number }>();

function getWindowBounds(window: PopularityWindow) {
  const now = new Date();
  if (window === "1h") {
    return {
      startTime: new Date(now.getTime() - 60 * 60 * 1000),
      endTime: now,
    };
  }
  if (window === "5h") {
    return {
      startTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      endTime: now,
    };
  }
  return {
    startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    endTime: now,
  };
}

export function extractCandidateKeywords(input: string, max = 5): string[] {
  const normalized = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4)
    .filter((word) => !STOP_WORDS.has(word));

  const freq = new Map<string, number>();
  for (const word of normalized) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

export async function getGoogleSearchInterest(
  keyword: string,
  window: PopularityWindow,
): Promise<number> {
  const cacheKey = `${window}:${keyword}`;
  const cached = trendsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const { startTime, endTime } = getWindowBounds(window);
    const raw = await googleTrends.interestOverTime({
      keyword,
      startTime,
      endTime,
      geo: "HT",
    });

    const parsed = JSON.parse(raw) as {
      default?: { timelineData?: Array<{ value?: number[] }> };
    };
    const values = (parsed.default?.timelineData ?? [])
      .map((entry) => entry.value?.[0] ?? 0)
      .filter((value) => Number.isFinite(value));

    const average =
      values.length > 0
        ? values.reduce((acc, current) => acc + current, 0) / values.length
        : 0;

    const normalized = Number(average.toFixed(2));
    trendsCache.set(cacheKey, {
      value: normalized,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return normalized;
  } catch {
    return 0;
  }
}

/** Default `5h` so the home feed tracks what is hottest in roughly the last five hours. */
export function normalizePopularityWindow(input: string | null | undefined): PopularityWindow {
  if (input === "1h" || input === "5h" || input === "24h") {
    return input;
  }
  return "5h";
}

export function computeSocialPopularityScore(input: {
  engagementTotals: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  mentionCount: number;
  platformCount: number;
}) {
  const engagement =
    input.engagementTotals.likes * 1.4 +
    input.engagementTotals.shares * 2.0 +
    input.engagementTotals.comments * 1.3 +
    input.engagementTotals.views * 0.01;

  const mentionBoost = Math.log2(1 + input.mentionCount) * 14;
  const platformBoost = Math.max(0, input.platformCount - 1) * 7;
  const engagementBoost = Math.log10(1 + engagement) * 30;

  return Number((engagementBoost + mentionBoost + platformBoost).toFixed(2));
}

export type { PopularityWindow };

