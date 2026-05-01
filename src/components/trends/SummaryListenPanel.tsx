"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { htCopy } from "@/lib/i18n/ht";

type SummaryListenPanelProps = {
  clusterId: string;
  title: string;
  summary: string;
};

function speechText(title: string, summary: string) {
  const combined = `${title.trim()}. ${summary.trim()}`.replace(/\s+/g, " ").trim();
  return combined.slice(0, 4000);
}

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  if (voices.length === 0) {
    return null;
  }
  const ht = voices.find((v) => v.lang.toLowerCase().startsWith("ht"));
  if (ht) {
    return ht;
  }
  const fr = voices.find((v) => v.lang.toLowerCase().startsWith("fr"));
  if (fr) {
    return fr;
  }
  const en = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  return en ?? voices[0] ?? null;
}

export function SummaryListenPanel({ clusterId, title, summary }: SummaryListenPanelProps) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    setPlaying(false);
    utteranceRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const toggle = useCallback(() => {
    if (!supported || typeof window === "undefined") {
      return;
    }
    const synth = window.speechSynthesis;
    if (playing) {
      stop();
      return;
    }

    const text = speechText(title, summary);
    if (!text) {
      return;
    }

    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(synth);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang || "fr-FR";
    } else {
      u.lang = "fr-FR";
    }
    u.rate = 0.92;
    u.pitch = 1;
    u.onend = () => {
      setPlaying(false);
      utteranceRef.current = null;
    };
    u.onerror = () => {
      setPlaying(false);
      utteranceRef.current = null;
    };
    utteranceRef.current = u;
    setPlaying(true);
    synth.speak(u);
  }, [supported, playing, title, summary, stop]);

  if (!supported) {
    return (
      <div className="mt-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[10px] text-slate-500">
        {htCopy.summaryListenUnsupported}
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-cyan-400/25 bg-gradient-to-br from-cyan-950/60 via-fuchsia-950/40 to-indigo-950/50 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/90">
        {htCopy.summaryListenTitle}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div
          className={`flex h-10 min-w-0 flex-1 items-end justify-start gap-0.5 rounded-md bg-black/20 px-2 py-1 ${playing ? "ring-1 ring-cyan-400/40" : ""}`}
          aria-hidden
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span
              key={`${clusterId}-bar-${i}`}
              className={`w-1 shrink-0 rounded-full bg-cyan-400/80 ${playing ? "animate-bounce" : "h-2 opacity-40"}`}
              style={
                playing
                  ? {
                      animationDelay: `${i * 85}ms`,
                      animationDuration: "0.6s",
                      height: "0.5rem",
                    }
                  : { height: "0.5rem" }
              }
            />
          ))}
        </div>
        <button
          type="button"
          onClick={toggle}
          className="shrink-0 rounded-full border border-cyan-300/40 bg-cyan-500/20 px-3 py-1.5 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
        >
          {playing ? htCopy.summaryListenCtaPause : htCopy.summaryListenCtaPlay}
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-slate-400">{htCopy.summaryListenHint}</p>
    </div>
  );
}
