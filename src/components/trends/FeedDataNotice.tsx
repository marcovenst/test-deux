import { htCopy } from "@/lib/i18n/ht";

export function FeedDataNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">{htCopy.feedFallbackTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-900/90">{htCopy.feedFallbackBody}</p>
    </div>
  );
}
