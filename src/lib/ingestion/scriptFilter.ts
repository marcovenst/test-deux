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
  if (letters < 6) {
    return 0;
  }
  return arabicLetters / letters;
}

export function shouldRejectLikelyArabicContent(title: string, content: string): boolean {
  const text = `${title}\n${content}`;
  const ratio = arabicLetterRatio(text);
  if (ratio >= 0.11) {
    return true;
  }
  if (ratio >= 0.06 && /\p{Script=Arabic}/u.test(title)) {
    return true;
  }
  return false;
}
