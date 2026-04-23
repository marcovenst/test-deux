"use client";

import { useEffect } from "react";

type TrendViewPingProps = {
  clusterId: string;
  onCount?: (count: number) => void;
};

export function TrendViewPing({ clusterId, onCount }: TrendViewPingProps) {
  useEffect(() => {
    if (clusterId.startsWith("fallback-")) {
      return;
    }

    const viewKey = `zra:viewed:${clusterId}`;
    if (window.localStorage.getItem(viewKey)) {
      return;
    }

    window.localStorage.setItem(viewKey, "1");

    fetch(`/api/cluster/${clusterId}/view`, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { totalViews?: number };
        if (typeof payload.totalViews === "number" && onCount) {
          onCount(payload.totalViews);
        }
      })
      .catch(() => {
        // no-op, view tracking should not block UI.
      });
  }, [clusterId, onCount]);

  return null;
}
