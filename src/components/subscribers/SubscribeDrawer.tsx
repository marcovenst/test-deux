"use client";

import { useState } from "react";

import { SubscribeForm } from "@/components/subscribers/SubscribeForm";

export function SubscribeDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-cyan-300/40 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/25"
      >
        Abòne
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/70"
          onClick={() => setOpen(false)}
        >
          <div className="h-[100dvh] overflow-y-auto p-3 sm:p-4">
            <div
              className="mx-auto my-2 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-neutral-950 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-neutral-950/95 px-4 py-3 backdrop-blur">
                <p className="text-sm font-semibold text-cyan-100">Abònman notifikasyon</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/25 px-3 py-1 text-xs text-neutral-200"
                >
                  Fèmen
                </button>
              </div>
              <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto p-4">
                <SubscribeForm />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

