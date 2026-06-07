/**
 * Drop items that are overwhelmingly not Latin-script (e.g. Arabic headlines/descriptions
 * that were incorrectly folded into “English” in normalizeLanguage).
 */
export function arabicLetterRatio(text: string): number {
  let letters = 0;
  let arabicLetters = 0;
  for (const ch of text) {
    if (/\p{L}/u.test(ch)) {
      letters += 1;
      if (/\p{Script=Arabic}/u.test(ch)) {
        arabicLetters += 1;
      }
    }
  }
  if (letters < 4) {
    return arabicLetters > 0 ? 1 : 0;
  }
  return arabicLetters / letters;
}

/** Headline is clearly Arabic even if the body is mostly Latin/Creole (common spam pattern). */
export function titleIsPrimarilyArabic(title: string): boolean {
  const t = title.trim();
  if (!t) return false;
  if (/[\u0600-\u06FF]{5,}/u.test(t)) {
    return true;
  }
  const letters = (t.match(/\p{L}/gu) ?? []).length;
  if (letters < 4) return false;
  return arabicLetterRatio(t) >= 0.06;
}

export function shouldRejectLikelyArabicContent(title: string, content: string): boolean {
  if (titleIsPrimarilyArabic(title)) {
    return true;
  }
  const text = `${title}\n${content}`;
  const ratio = arabicLetterRatio(text);
  if (ratio >= 0.08) {
    return true;
  }
  if (ratio >= 0.05 && /\p{Script=Arabic}/u.test(title)) {
    return true;
  }
  return false;
}

/**
 * Hide clusters in the UI when legacy DB rows still contain Arabic promos (feeds title + summary).
 */
export function shouldHideArabicTrendItem(title: string, summary: string): boolean {
  if (titleIsPrimarilyArabic(title)) {
    return true;
  }
  const block = `${title}\n${summary}`;
  return arabicLetterRatio(block) >= 0.06;
}
