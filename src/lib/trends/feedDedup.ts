import type { TrendFeedItem } from "@/lib/trends/query";
import { normalizeTrendTitleKey } from "@/lib/trends/titleKey";

/** Keep the highest-ranked row per normalized headline (input should already be sorted). */
export function dedupeTrendsByTitle(items: TrendFeedItem[]): TrendFeedItem[] {
  const seenTitles = new Set<string>();
  const deduped: TrendFeedItem[] = [];

  for (const item of items) {
    const titleKey = normalizeTrendTitleKey(item.title.trim());
    if (!titleKey || seenTitles.has(titleKey)) {
      continue;
    }
    seenTitles.add(titleKey);
    deduped.push(item);
  }

  return deduped;
}
