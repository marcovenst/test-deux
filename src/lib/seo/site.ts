/** Production-ready default when env is missing (e.g. CI). */
export const PRODUCTION_SITE_URL = "https://zenlakay.com";

export const SITE_NAME = "Zen Rezo A";

export const DEFAULT_TITLE = `${SITE_NAME} | Sakap pase jodi a`;

export const DEFAULT_DESCRIPTION =
  "Zen Rezo A — Haitian news and trends dashboard: breaking stories, diaspora topics, sports, viral video, and community voices in Haitian Creole. Nouvèl Ayiti, tandans, espò, ak kominote a.";

export const SEO_KEYWORDS = [
  "Haiti news",
  "Haitian news",
  "nouvèl Ayiti",
  "actualité Haïti",
  "Haitian Creole news",
  "diaspora Haiti",
  "Ayiti jodi a",
  "trends Haiti",
];

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!raw) {
    return PRODUCTION_SITE_URL;
  }
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function truncateForMeta(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) {
    return t;
  }
  const slice = t.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trimEnd() + "…";
}
