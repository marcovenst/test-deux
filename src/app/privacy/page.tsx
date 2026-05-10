import type { Metadata } from "next";
import Link from "next/link";

import { htCopy } from "@/lib/i18n/ht";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Konfidansyalite ak koukis",
  description:
    "Politik konfidansyalite Zen Rezo A: dwa orijinal, abònman, koukis, piblisite Google (AdSense), ak kijan pou kontakte nou.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ht_HT",
    url: absoluteUrl("/privacy"),
    title: `Konfidansyalite | ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const site = getSiteUrl();
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? htCopy.footerContactEmail;

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6 text-sm leading-relaxed">
        <p>
          <Link href="/" className="text-cyan-300 hover:text-cyan-200">
            ← Retounen nan akèy la
          </Link>
        </p>
        <h1 className="text-2xl font-bold text-white">Konfidansyalite ak koukis</h1>
        <p className="text-xs text-neutral-400">Dènye aksyon: Me 2026 · Site: {site}</p>

        <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Ki moun ki jere sit la?</h2>
          <p className="text-neutral-300">
            <strong className="text-white">{SITE_NAME}</strong> (“nou”, “nou an”) opere sit entènèt ki disponib nan{" "}
            <a href={site} className="text-cyan-300 underline-offset-2 hover:text-cyan-200">
              {site}
            </a>
            . Nou respekte vi prive w epi nou eksplike ki kalite enfòmasyon ki ka kolekta lè w itilize sèvis la.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Enfòmasyon ou bay dirèkteman</h2>
          <p className="text-neutral-300">
            Lè w abòne imèl oswa SMS, nou ka sere adrès ou selman pou voye rezime, alèt, oswa mesaj ki gen rapò ak enterè w
            te chwazi. Ou ka mande pou sispann kominikasyon an nenpòt lè (swiv enstriksyon nan mesaj yo oswa kontakte nou).
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Koukis ak teknoloji santral</h2>
          <p className="text-neutral-300">
            Sit la ka itilize koukis ak teknik ki sanble (echiv sesyon, paramèt nitrisit) pou fè platfòm nan
            fonksyone, mezire trafik, ak amelyore eksperyans. Ou ka konfigire navigatè w pou bloke koukis; kek fonksyonalite
            ka pa mache san yo.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-amber-400/20 bg-amber-500/5 p-5">
          <h2 className="text-lg font-semibold text-white">Piblisite Google (AdSense)</h2>
          <p className="text-neutral-300">
            Sit la ka affiche anons ki soti nan{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              className="text-cyan-300 underline-offset-2 hover:text-cyan-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google
            </a>{" "}
            (Google AdSense). Google (ak patnè li yo) ka itilize koukis oswa idantifyan mobil pou montre ou anons ki adapte
            ak vizit ou. Ou ka konsilte{" "}
            <a
              href="https://adssettings.google.com/"
              className="text-cyan-300 underline-offset-2 hover:text-cyan-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anons Google — Paramèt pèsonalize
            </a>{" "}
            pou jere preferans ou. Fichye{" "}
            <a href={`${site}/ads.txt`} className="text-cyan-300 underline-offset-2 hover:text-cyan-200">
              ads.txt
            </a>{" "}
            sou domèn nou an endike ki moun ki otorize vann anons.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Lyen ak kontni twazyèm pati</h2>
          <p className="text-neutral-300">
            Atik ak tandans yo mennen sou sit lòt moun (jounal, rezo sosyal, magazen). Politik konfidansyalite yo se pa
            ta nou. Verifye kondisyon chak sit avan w pataje done pèsonèl.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Kontak</h2>
          <p className="text-neutral-300">
            Kesyon sou konfidansyalite:{" "}
            <a href={`mailto:${contact}`} className="text-cyan-300 hover:text-cyan-200">
              {contact}
            </a>
            .
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-neutral-400">
          <h2 className="text-lg font-semibold text-white">Privacy (English summary)</h2>
          <p>
            {SITE_NAME} may use cookies and similar technologies. Third-party advertising (Google AdSense) may use cookies
            to personalize ads. You can manage ad personalization through Google’s ads settings. Subscriber data is used
            only to deliver the communications you signed up for. For questions, contact{" "}
            <a href={`mailto:${contact}`} className="text-cyan-300 hover:text-cyan-200">
              {contact}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
