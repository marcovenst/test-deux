"use client";

import { useState } from "react";

type PlanId = "daily_1" | "bundle_5" | "monthly_30";

const PLAN_OPTIONS: Array<{
  id: PlanId;
  label: string;
  detail: string;
  popular?: boolean;
}> = [
  { id: "daily_1", label: "$5", detail: "1 day" },
  { id: "bundle_5", label: "$20", detail: "5 days", popular: true },
  { id: "monthly_30", label: "$50", detail: "30 days" },
];

type SubmitState = {
  status: "idle" | "loading" | "error";
  message: string;
};

type SelfServeAdLauncherProps = {
  buttonLabel?: string;
  subtle?: boolean;
};

export function SelfServeAdLauncher({
  buttonLabel = "Mete anons ou",
  subtle = false,
}: SelfServeAdLauncherProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("daily_1");
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });

  async function submitAd(formData: FormData) {
    setSubmitState({
      status: "loading",
      message: "N ap prepare peman an...",
    });

    const payload = {
      businessName: String(formData.get("businessName") ?? "").trim(),
      contactEmail: String(formData.get("contactEmail") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      imageUrl: String(formData.get("imageUrl") ?? "").trim(),
      targetUrl: String(formData.get("targetUrl") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      planId: selectedPlanId,
    };

    const response = await fetch("/api/ads/self-serve/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setSubmitState({
        status: "error",
        message: body?.error ?? "Peman an pa disponib pou kounye a.",
      });
      return;
    }

    const body = (await response.json()) as { checkoutUrl?: string };
    if (!body.checkoutUrl) {
      setSubmitState({
        status: "error",
        message: "Nou pa jwenn lyen peman an. Tanpri eseye ankò.",
      });
      return;
    }

    window.location.href = body.checkoutUrl;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          subtle
            ? "rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
            : "rounded-full border border-cyan-300/40 bg-cyan-300/15 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/25"
        }
      >
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/70" onClick={() => setOpen(false)}>
          <div className="h-[100dvh] overflow-y-auto p-3 sm:p-4">
            <div
              className="mx-auto my-3 w-full max-w-xl rounded-2xl border border-white/20 bg-neutral-950 p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-cyan-100">Self-serve ads</p>
                  <p className="text-xs text-neutral-400">
                    Chwazi plan ou: $5/1 jou, $20/5 jou, oswa $50/30 jou.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/25 px-3 py-1 text-xs text-neutral-200"
                >
                  Fèmen
                </button>
              </div>

              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitAd(new FormData(event.currentTarget));
                }}
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  {PLAN_OPTIONS.map((plan) => {
                    const active = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`rounded-lg border px-3 py-2 text-left ${
                          active
                            ? "border-cyan-300/70 bg-cyan-300/20 text-cyan-100"
                            : "border-white/20 bg-black/20 text-neutral-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{plan.label}</p>
                          {plan.popular ? (
                            <span className="rounded-full border border-amber-300/50 bg-amber-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                              Most popular
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs">{plan.detail}</p>
                      </button>
                    );
                  })}
                </div>

                <input
                  required
                  name="businessName"
                  placeholder="Non biznis / paj la"
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
                />
                <input
                  required
                  type="email"
                  name="contactEmail"
                  placeholder="Email kontak"
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
                />
                <input
                  required
                  name="title"
                  placeholder="Tit anons lan"
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
                />
                <input
                  required
                  type="url"
                  name="imageUrl"
                  placeholder="Link imaj (https://...)"
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
                />
                <input
                  required
                  type="url"
                  name="targetUrl"
                  placeholder="Lyen destinasyon (https://...)"
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
                />
                <textarea
                  name="description"
                  placeholder="Deskripsyon kout (opsyonèl)"
                  className="min-h-[80px] w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
                />

                <button
                  type="submit"
                  disabled={submitState.status === "loading"}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitState.status === "loading"
                    ? "Tanpri tann..."
                    : `Kontinye pou peman ${
                        PLAN_OPTIONS.find((plan) => plan.id === selectedPlanId)?.label ?? "$5"
                      }`}
                </button>

                {submitState.message ? (
                  <p className="text-sm text-rose-200">{submitState.message}</p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
