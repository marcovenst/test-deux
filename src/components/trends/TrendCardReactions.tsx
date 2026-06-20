"use client";

import type { TrendCardEngagement } from "@/components/trends/useTrendCardEngagement";

type ReactionKey = "sa_raz" | "sa_komik" | "sa_enteresan";

function reactionPercentForKey(
  key: ReactionKey,
  breakdown: TrendCardEngagement["reactionBreakdown"],
) {
  if (key === "sa_raz") {
    return breakdown.sa_raz;
  }
  if (key === "sa_komik") {
    return breakdown.sa_komik;
  }
  return breakdown.sa_enteresan;
}

type TrendCardReactionsProps = {
  engagement: TrendCardEngagement;
};

export function TrendCardReactions({ engagement }: TrendCardReactionsProps) {
  const {
    selectedReaction,
    reactionTotals,
    reactionBreakdown,
    submitReaction,
    isSubmittingReaction,
    animatingReaction,
  } = engagement;

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
        Ki jan ou te wè post sa?
      </p>
      {selectedReaction ? (
        <div className="mt-2 space-y-2 text-[11px]">
          {(
            [
              { key: "sa_raz", label: "Raz", emoji: "🪫", activeClass: "bg-rose-400/15 text-rose-200" },
              { key: "sa_komik", label: "Komik", emoji: "😂", activeClass: "bg-amber-400/15 text-amber-200" },
              { key: "sa_enteresan", label: "Enteresan", emoji: "🔥", activeClass: "bg-cyan-400/15 text-cyan-200" },
            ] as const
          ).map((option) => {
            const percent = reactionPercentForKey(option.key, reactionBreakdown);
            const isSelected = selectedReaction === option.key;
            return (
              <div
                key={option.key}
                className={`relative overflow-hidden rounded-lg border border-white/15 px-3 py-2 ${
                  isSelected ? option.activeClass : "bg-black/20 text-slate-200"
                }`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-white/10 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 font-medium">
                    {isSelected ? "✓" : null} {option.label} {option.emoji}
                  </span>
                  <span className="font-semibold">{percent}%</span>
                </div>
              </div>
            );
          })}
          <div className="pt-0.5 text-[10px] text-slate-400">{reactionTotals.totalVotes} vòt</div>
        </div>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => submitReaction("sa_raz")}
              disabled={isSubmittingReaction}
              className={`rounded-lg border px-2 py-2 transition ${
                selectedReaction === "sa_raz"
                  ? "border-rose-400/40 bg-rose-400/15 text-rose-200"
                  : "border-white/15 bg-black/20 text-slate-200 hover:border-rose-400/40"
              } ${animatingReaction === "sa_raz" ? "zra-reaction-raz" : ""}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span>Raz</span>
                <span>🪫</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => submitReaction("sa_komik")}
              disabled={isSubmittingReaction}
              className={`rounded-lg border px-2 py-2 transition ${
                selectedReaction === "sa_komik"
                  ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                  : "border-white/15 bg-black/20 text-slate-200 hover:border-amber-400/40"
              } ${animatingReaction === "sa_komik" ? "zra-reaction-komik" : ""}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span>Komik</span>
                <span>😂</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => submitReaction("sa_enteresan")}
              disabled={isSubmittingReaction}
              className={`rounded-lg border px-2 py-2 transition ${
                selectedReaction === "sa_enteresan"
                  ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200"
                  : "border-white/15 bg-black/20 text-slate-200 hover:border-cyan-400/40"
              } ${animatingReaction === "sa_enteresan" ? "zra-reaction-enteresan" : ""}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span>Enteresan</span>
                <span>🔥</span>
              </span>
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Klike sou yon bouton pou wè rezilta yo.</p>
        </>
      )}
      <style jsx>{`
        @keyframes zraShake {
          0% { transform: translateX(0) scale(1); }
          20% { transform: translateX(-3px) rotate(-2deg) scale(1.03); }
          40% { transform: translateX(3px) rotate(2deg) scale(1.03); }
          60% { transform: translateX(-2px) rotate(-1deg) scale(1.02); }
          80% { transform: translateX(2px) rotate(1deg) scale(1.01); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes zraBounceGlow {
          0% { transform: translateY(0) scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
          30% { transform: translateY(-5px) scale(1.04); box-shadow: 0 0 18px rgba(251, 191, 36, 0.35); }
          60% { transform: translateY(1px) scale(1.02); box-shadow: 0 0 12px rgba(251, 191, 36, 0.2); }
          100% { transform: translateY(0) scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
        }
        @keyframes zraPulseShimmer {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(34, 211, 238, 0); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(34, 211, 238, 0.35); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(34, 211, 238, 0); }
        }
        .zra-reaction-raz {
          animation: zraShake 0.7s ease;
        }
        .zra-reaction-komik {
          animation: zraBounceGlow 0.72s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .zra-reaction-enteresan {
          animation: zraPulseShimmer 0.7s ease;
        }
      `}</style>
    </div>
  );
}
