import { htCopy } from "@/lib/i18n/ht";

export function FeedDataNotice() {
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
      <p className="font-semibold">{htCopy.feedFallbackTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-200/90">{htCopy.feedFallbackBody}</p>
    </div>
  );
}
