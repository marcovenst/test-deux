"use client";

import { useState } from "react";

type Overrides = {
  enabled: boolean;
  provider: "none" | "google" | "direct";
  googleClientId: string;
  slotIds: {
    feedTop: string;
    feedMid: string;
    sidebar: string;
  };
  directAd: {
    title: string;
    imageUrl: string;
    targetUrl: string;
    description: string;
  };
};

const DEFAULT_OVERRIDES: Overrides = {
  enabled: false,
  provider: "none",
  googleClientId: "",
  slotIds: {
    feedTop: "1000001",
    feedMid: "1000002",
    sidebar: "1000003",
  },
  directAd: {
    title: "Piblisite",
    imageUrl: "",
    targetUrl: "",
    description: "Mete anons ou isit pou rive sou kominote ayisyen an.",
  },
};

export function AdsAdminPanel() {
  const [token, setToken] = useState("");
  const [overrides, setOverrides] = useState<Overrides>(DEFAULT_OVERRIDES);
  const [status, setStatus] = useState<string>("");

  async function loadOverrides() {
    if (!token) {
      setStatus("Tanpri mete admin token an.");
      return;
    }
    const res = await fetch("/api/admin/ads", {
      headers: {
        "x-admin-token": token,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      setStatus("Pa otorize oswa token pa bon.");
      return;
    }
    const payload = (await res.json()) as {
      overrides?: Partial<Overrides>;
    };
    setOverrides({
      ...DEFAULT_OVERRIDES,
      ...(payload.overrides ?? {}),
      slotIds: {
        ...DEFAULT_OVERRIDES.slotIds,
        ...(payload.overrides?.slotIds ?? {}),
      },
      directAd: {
        ...DEFAULT_OVERRIDES.directAd,
        ...(payload.overrides?.directAd ?? {}),
      },
    });
    setStatus("Konfig ads yo chaje.");
  }

  async function saveOverrides() {
    if (!token) {
      setStatus("Tanpri mete admin token an.");
      return;
    }
    const res = await fetch("/api/admin/ads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify(overrides),
    });
    if (!res.ok) {
      setStatus("Echèk pandan sove ads config.");
      return;
    }
    setStatus("Ads config sove. Rafrechi paj prensipal la pou verifye.");
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h1 className="text-2xl font-bold text-white">Admin Ads</h1>
        <p className="text-sm text-neutral-300">
          Jere monetizasyon sit la san ou pa modifye kòd la.
        </p>

        <div className="space-y-2">
          <label className="text-sm text-neutral-300">Admin token</label>
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={loadOverrides}
            className="rounded-full border border-white/20 px-4 py-2 text-sm"
          >
            Chaje konfig
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={overrides.enabled}
            onChange={(event) =>
              setOverrides((current) => ({ ...current, enabled: event.target.checked }))
            }
          />
          Ads aktive
        </label>

        <div className="space-y-2">
          <label className="text-sm text-neutral-300">Provider</label>
          <select
            value={overrides.provider}
            onChange={(event) =>
              setOverrides((current) => ({
                ...current,
                provider: event.target.value as Overrides["provider"],
              }))
            }
            className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
          >
            <option value="none">none</option>
            <option value="google">google</option>
            <option value="direct">direct</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={overrides.googleClientId}
            onChange={(event) =>
              setOverrides((current) => ({ ...current, googleClientId: event.target.value }))
            }
            placeholder="Google client ID (ca-pub-...)"
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
          />
          <input
            value={overrides.slotIds.feedTop}
            onChange={(event) =>
              setOverrides((current) => ({
                ...current,
                slotIds: { ...current.slotIds, feedTop: event.target.value },
              }))
            }
            placeholder="Slot feedTop"
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
          />
          <input
            value={overrides.slotIds.feedMid}
            onChange={(event) =>
              setOverrides((current) => ({
                ...current,
                slotIds: { ...current.slotIds, feedMid: event.target.value },
              }))
            }
            placeholder="Slot feedMid"
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
          />
          <input
            value={overrides.slotIds.sidebar}
            onChange={(event) =>
              setOverrides((current) => ({
                ...current,
                slotIds: { ...current.slotIds, sidebar: event.target.value },
              }))
            }
            placeholder="Slot sidebar"
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <input
            value={overrides.directAd.title}
            onChange={(event) =>
              setOverrides((current) => ({
                ...current,
                directAd: { ...current.directAd, title: event.target.value },
              }))
            }
            placeholder="Direct ad title"
            className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
          />
          <input
            value={overrides.directAd.imageUrl}
            onChange={(event) =>
              setOverrides((current) => ({
                ...current,
                directAd: { ...current.directAd, imageUrl: event.target.value },
              }))
            }
            placeholder="Direct ad image URL"
            className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
          />
          <input
            value={overrides.directAd.targetUrl}
            onChange={(event) =>
              setOverrides((current) => ({
                ...current,
                directAd: { ...current.directAd, targetUrl: event.target.value },
              }))
            }
            placeholder="Direct ad target URL"
            className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
          />
          <textarea
            value={overrides.directAd.description}
            onChange={(event) =>
              setOverrides((current) => ({
                ...current,
                directAd: { ...current.directAd, description: event.target.value },
              }))
            }
            placeholder="Direct ad description"
            className="min-h-[90px] w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={saveOverrides}
          className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-black"
        >
          Sove ads config
        </button>

        {status ? <p className="text-sm text-emerald-200">{status}</p> : null}
      </div>
    </main>
  );
}

