import type { TrendFeedItem } from "@/lib/trends/query";

/** Keywords when we only have cluster DB title (before summaries load). */
function titleHintsMatchCategory(titleLower: string, category: string): boolean {
  switch (category) {
    case "politics":
      return /\b(politik|politics|election|eleksyon|gouvènman|senat|depute|deputi|prezidan|primatur|manifestasyon\s+pol|opozisyon|parlè|konstitisyon)\b/i.test(
        titleLower,
      );
    case "music":
      return /\b(mizik|music|konpa|rap|atistik|showbiz|album|klip|dj|guitar)\b/i.test(titleLower);
    case "disaster":
      return /\b(dezas|cyclone|tranble|trembleman|earthquake|inondasyon|sekirite\s+sivil|katastwòf|siklòn|hurr(icane)?)\b/i.test(
        titleLower,
      );
    case "diaspora":
      return /\b(dyaspora|diaspora|abroad|etranje|lot\s*bo|boston|miami|montreal|ny(c)?|canada\s+ayisyen)\b/i.test(
        titleLower,
      );
    case "culture":
      return /\b(kilti|culture|tradisyon|festival|littérati|liv|atis\s+visyèl)\b/i.test(titleLower);
    case "community":
      return /\b(kominote|community|lokal|katye|mobilizasyon\s+kominotè|sekirite\s+katye)\b/i.test(
        titleLower,
      );
    case "immigration":
      return /\b(immigration|uscis|\btps\b|parole|asylum|visa|deport|imigrasyon|deportasyon|viza|refijye|frontyè|border|green\s*card|work\s*permit|uscis)\b/i.test(
        titleLower,
      );
    case "funny":
      return /\b(komik|funny|meme|gag|ri\s*\(|lol)\b/i.test(titleLower);
    case "religion":
      return /\b(relijyon|religion|legliz|bondye|kretyen|vodou|pastè|mes|lapriyè)\b/i.test(
        titleLower,
      );
    case "viral":
      return /\b(viral|viralite|trend(ing)?|fè\s+bri|pataje\s+anpil)\b/i.test(titleLower);
    case "general":
      return /\b(jeneral|general|aktyalite|nouvèl\s+peyi|flash)\b/i.test(titleLower);
    case "sports":
      return /\b(esp[oò]|foutb[oò]l|football|soccer|grenady|match|jw[eè]|ekip|fifa|concacaf|lig|stade|stadium|klasman|goal|selection)\b/i.test(
        titleLower,
      );
    default:
      return false;
  }
}

export function clusterMetaMatchesCategory(
  row: { title: string | null; trend_category: string | null },
  category: string,
): boolean {
  if (!category || category === "all") return true;
  const tc = (row.trend_category ?? "general").toLowerCase();
  const cat = category.toLowerCase();
  if (tc === cat) return true;
  return titleHintsMatchCategory((row.title ?? "").toLowerCase(), cat);
}

export function matchesImmigrationTopic(t: TrendFeedItem): boolean {
  return feedItemMatchesCategory(t, "immigration");
}

export function matchesSportsTopic(t: TrendFeedItem): boolean {
  return feedItemMatchesCategory(t, "sports");
}

/** Full-text match using title, summary, tags, and trend category (for main feed topic filter). */
export function feedItemMatchesCategory(t: TrendFeedItem, category: string): boolean {
  if (!category || category === "all") return true;

  const cat = category.toLowerCase();
  const tc = (t.trendCategory ?? "general").toLowerCase();
  if (tc === cat) return true;

  const blob = `${t.title} ${t.summary} ${(t.tags ?? []).join(" ")}`.toLowerCase();

  switch (cat) {
    case "immigration":
      return (
        tc === "diaspora" ||
        /\b(immigration|uscis|\btps\b|parole|asylum|visa|deport|imigrasyon|deportasyon|viza|refijye|frontyè|border|green card|work permit)\b/i.test(
          blob,
        )
      );
    case "sports":
      return /\b(esp[oò]|foutb[oò]l|football|soccer|grenady|match|jw[eè]|jwe|ekip|fifa|concacaf|lig|stade|stadium|klasman|goal|coup du monde|selection|championnat)\b/i.test(
        blob,
      );
    case "politics":
      return /\b(politik|politics|election|eleksyon|gouvènman|senat|depute|deputi|prezidan|primatur|manifestasyon|opal|opozisyon|parlè|konstitisyon|diplomasi)\b/i.test(
        blob,
      );
    case "music":
      return /\b(mizik|music|konpa|rap|atistik|showbiz|album|klip|dj\s|son\s|guitar|festiv\s+mizik)\b/i.test(
        blob,
      );
    case "disaster":
      return /\b(dezas|cyclone|tranble|trembleman|earthquake|inondasyon|sekirite sivil|katastwòf|siklòn|hurricane)\b/i.test(
        blob,
      );
    case "diaspora":
      return /\b(dyaspora|diaspora|abroad|etranje|lot bo|boston|miami|montreal|ny\b|kay\s+lot\s+bo)\b/i.test(
        blob,
      );
    case "culture":
      return /\b(kilti|culture|tradisyon|festival|literati|liv\s|teyat)\b/i.test(blob);
    case "community":
      return /\b(kominote|community|lokal|katye|sekirite|pwovizwa|wout|kouran|dlo)\b/i.test(blob);
    case "funny":
      return /\b(komik|funny|meme|ri\s|lol|gag)\b/i.test(blob);
    case "religion":
      return /\b(relijyon|religion|legliz|bondye|kretyen|vodou|pastè|mes\s|lapriyè|lekòl\s+biblik)\b/i.test(
        blob,
      );
    case "viral":
      return /\b(viral|viralite|tiktok|trend(ing)?|fè bri|pataje anpil)\b/i.test(blob);
    case "general":
      return (
        tc === "general" ||
        /\b(jeneral|general|aktyalite|nouvèl|flash|peyi\s+a)\b/i.test(blob)
      );
    default:
      return false;
  }
}
