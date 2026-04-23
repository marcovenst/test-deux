"use client";

import { useMemo, useState } from "react";

const INTEREST_CATEGORIES = [
  "immigration",
  "sports",
  "music",
  "diaspora",
  "politics",
  "culture",
  "community",
];

type SubmitState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export function SubscribeForm() {
  const [contactChannel, setContactChannel] = useState<"email" | "phone">("email");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["immigration"]);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });

  const interestSet = useMemo(() => new Set(selectedInterests), [selectedInterests]);

  async function onSubmit(formData: FormData) {
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const keywords = String(formData.get("keywords") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const notifyRealtime = formData.get("notifyRealtime") === "on";

    setSubmitState({
      status: "loading",
      message: "N ap anrejistre enfòmasyon ou...",
    });

    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        contactChannel,
        email: contactChannel === "email" ? email : undefined,
        phone: contactChannel === "phone" ? phone : undefined,
        interests: selectedInterests,
        keywords,
        notifyRealtime,
      }),
    });

    if (!response.ok) {
      setSubmitState({
        status: "error",
        message: "Gen yon pwoblèm. Tanpri verifye done yo epi eseye ankò.",
      });
      return;
    }

    setSubmitState({
      status: "success",
      message: "Ou byen enskri. W ap resevwa alèt sou sijè ou chwazi yo.",
    });
  }

  return (
    <section className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-5">
      <h2 className="text-lg font-bold text-white">Abònman alèt an tan reyèl</h2>
      <p className="mt-1 text-xs text-cyan-50/90">
        Mete email oswa nimewo telefòn ou pou resevwa nouvo istwa sou sijè ou renmen yo.
      </p>

      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          void onSubmit(formData);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="fullName"
            required
            placeholder="Non konplè"
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
          />
          <div className="flex items-center gap-3 rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm">
            <label className="flex items-center gap-1 text-neutral-200">
              <input
                type="radio"
                name="contactChannel"
                value="email"
                checked={contactChannel === "email"}
                onChange={() => setContactChannel("email")}
              />
              Email
            </label>
            <label className="flex items-center gap-1 text-neutral-200">
              <input
                type="radio"
                name="contactChannel"
                value="phone"
                checked={contactChannel === "phone"}
                onChange={() => setContactChannel("phone")}
              />
              Telefòn
            </label>
          </div>
        </div>

        {contactChannel === "email" ? (
          <input
            name="email"
            type="email"
            required
            placeholder="Email ou"
            className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
          />
        ) : (
          <input
            name="phone"
            type="tel"
            required
            placeholder="Nimewo telefòn (+509...)"
            className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
          />
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-50">
            Enterè ou
          </p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_CATEGORIES.map((category) => {
              const selected = interestSet.has(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedInterests((current) => {
                      if (current.includes(category)) {
                        return current.filter((item) => item !== category);
                      }
                      return [...current, category];
                    });
                  }}
                  className={`rounded-full px-3 py-1 text-xs ${
                    selected
                      ? "bg-white text-black"
                      : "border border-white/25 bg-black/20 text-neutral-200"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <input
          name="keywords"
          placeholder="Mo kle espesyal (separe ak vigil), eg: USCIS, Grenadye"
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
        />

        <label className="flex items-center gap-2 text-sm text-neutral-200">
          <input name="notifyRealtime" type="checkbox" defaultChecked />
          Voye m alèt otomatik lè nouvo istwa parèt.
        </label>

        <button
          type="submit"
          disabled={selectedInterests.length === 0 || submitState.status === "loading"}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitState.status === "loading" ? "Tanpri tann..." : "Abòne kounye a"}
        </button>

        {submitState.message ? (
          <p
            className={`text-sm ${
              submitState.status === "error" ? "text-rose-200" : "text-emerald-200"
            }`}
          >
            {submitState.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}

