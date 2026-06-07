"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { composeDisplayViews, randomViewBaseline } from "@/lib/trends/displayViews";
import type { TrendFeedItem } from "@/lib/trends/query";

type ReactionKey = "sa_raz" | "sa_komik" | "sa_enteresan";

type ReactionTotals = {
  saRaz: number;
  saKomik: number;
  saEnteresan: number;
  totalVotes: number;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getOrCreateVoterId() {
  const key = "zra:voter-id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const next =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `anon-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  window.localStorage.setItem(key, next);
  return next;
}

function getReactionBreakdown(totals: ReactionTotals) {
  const denom = Math.max(1, totals.totalVotes);
  return {
    sa_raz: Math.round((totals.saRaz / denom) * 100),
    sa_komik: Math.round((totals.saKomik / denom) * 100),
    sa_enteresan: Math.round((totals.saEnteresan / denom) * 100),
  };
}

function toLocalReactionStorage(clusterId: string): ReactionTotals | null {
  const raw = window.localStorage.getItem(`zra:reaction:totals:${clusterId}`);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ReactionTotals;
    if (
      typeof parsed.saRaz === "number" &&
      typeof parsed.saKomik === "number" &&
      typeof parsed.saEnteresan === "number" &&
      typeof parsed.totalVotes === "number"
    ) {
      return parsed;
    }
  } catch {
    // ignore malformed local cache
  }
  return null;
}

export type TrendCardEngagement = ReturnType<typeof useTrendCardEngagement>;

export function useTrendCardEngagement(
  trend: TrendFeedItem,
  articleRef: RefObject<HTMLElement | null>,
) {
  const viewBaselineRef = useRef(randomViewBaseline());
  const [viewCount, setViewCount] = useState(() =>
    composeDisplayViews(viewBaselineRef.current, trend.viewCount),
  );
  const [selectedReaction, setSelectedReaction] = useState<ReactionKey | null>(null);
  const [reactionTotals, setReactionTotals] = useState<ReactionTotals>(trend.reactions);
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState<ReactionKey | null>(null);
  const reactionAnimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const node = articleRef.current;
    if (!node || trend.clusterId.startsWith("fallback-")) {
      return;
    }

    const viewKey = `zra:viewed:${trend.clusterId}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(viewKey)) {
      return;
    }

    let fired = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (fired || !entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        fired = true;
        observer.disconnect();

        if (typeof window !== "undefined") {
          window.localStorage.setItem(viewKey, "1");
        }

        fetch(`/api/cluster/${trend.clusterId}/view`, {
          method: "POST",
          cache: "no-store",
          keepalive: true,
        })
          .then(async (response) => {
            if (!response.ok) {
              setViewCount((current) => current + 1);
              return;
            }
            const payload = (await response.json()) as { totalViews?: number };
            if (typeof payload.totalViews === "number") {
              setViewCount(composeDisplayViews(viewBaselineRef.current, payload.totalViews));
              return;
            }
            setViewCount((current) => current + 1);
          })
          .catch(() => {
            setViewCount((current) => current + 1);
          });
      },
      { threshold: 0.45 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [trend.clusterId, articleRef]);

  useEffect(() => {
    const stored = window.localStorage.getItem(`zra:reaction:${trend.clusterId}`);
    if (stored === "sa_raz" || stored === "sa_komik" || stored === "sa_enteresan") {
      setSelectedReaction(stored);
    }
    const localTotals = toLocalReactionStorage(trend.clusterId);
    if (localTotals) {
      setReactionTotals(localTotals);
    }
  }, [trend.clusterId]);

  useEffect(() => {
    return () => {
      if (reactionAnimTimeoutRef.current) {
        clearTimeout(reactionAnimTimeoutRef.current);
      }
    };
  }, []);

  const reactionBreakdown = useMemo(
    () => getReactionBreakdown(reactionTotals),
    [reactionTotals],
  );

  async function submitReaction(nextReaction: ReactionKey) {
    if (isSubmittingReaction) {
      return;
    }
    setIsSubmittingReaction(true);
    const previousReaction = selectedReaction;
    const previousTotals = reactionTotals;

    const optimistic: ReactionTotals = { ...reactionTotals };
    if (!previousReaction) {
      optimistic.totalVotes += 1;
    } else if (previousReaction === "sa_raz") {
      optimistic.saRaz = Math.max(0, optimistic.saRaz - 1);
    } else if (previousReaction === "sa_komik") {
      optimistic.saKomik = Math.max(0, optimistic.saKomik - 1);
    } else {
      optimistic.saEnteresan = Math.max(0, optimistic.saEnteresan - 1);
    }
    if (nextReaction === "sa_raz") {
      optimistic.saRaz += 1;
    } else if (nextReaction === "sa_komik") {
      optimistic.saKomik += 1;
    } else {
      optimistic.saEnteresan += 1;
    }

    setSelectedReaction(nextReaction);
    setReactionTotals(optimistic);
    window.localStorage.setItem(`zra:reaction:${trend.clusterId}`, nextReaction);
    window.localStorage.setItem(`zra:reaction:totals:${trend.clusterId}`, JSON.stringify(optimistic));
    setAnimatingReaction(nextReaction);
    if (reactionAnimTimeoutRef.current) {
      clearTimeout(reactionAnimTimeoutRef.current);
    }
    reactionAnimTimeoutRef.current = setTimeout(() => {
      setAnimatingReaction(null);
    }, 750);

    const canSyncToApi = UUID_REGEX.test(trend.clusterId);
    if (!canSyncToApi) {
      setIsSubmittingReaction(false);
      return;
    }

    try {
      const voterId = getOrCreateVoterId();
      const response = await fetch(`/api/cluster/${trend.clusterId}/reaction`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, reaction: nextReaction }),
      });
      if (!response.ok) {
        throw new Error("reaction request failed");
      }
      const payload = (await response.json()) as {
        totals?: ReactionTotals;
        selectedReaction?: ReactionKey;
      };
      if (payload.totals) {
        setReactionTotals(payload.totals);
        window.localStorage.setItem(
          `zra:reaction:totals:${trend.clusterId}`,
          JSON.stringify(payload.totals),
        );
      }
      if (payload.selectedReaction) {
        setSelectedReaction(payload.selectedReaction);
      }
    } catch {
      void previousTotals;
      void previousReaction;
    } finally {
      setIsSubmittingReaction(false);
    }
  }

  return {
    viewCount,
    selectedReaction,
    reactionTotals,
    reactionBreakdown,
    submitReaction,
    isSubmittingReaction,
    animatingReaction,
  };
}
