/**
 * Amazon og:image and social thumbnails use tiny variants (e.g. SX216, QL10_SX980)
 * that look blurry in product grids. Primary detail images use hiRes / SL1500.
 * Only rewrite when the URL looks like a small asset; leave full-size URLs as-is.
 */
export function amazonCatalogImageUrl(url: string): string {
  const s = url.trim();
  if (!s || !s.includes("media-amazon.com/images/I/")) {
    return s;
  }
  const tiny =
    /SX\d{2,4}|SY\d{2,4}|QL25|QL10_SX\d|FMwebp|_AC_PT0_BL0_|SY55_FMwebp/i.test(s) ||
    /\._AC_QL\d+_/i.test(s);
  if (!tiny) {
    return s.split("?")[0];
  }
  try {
    const noQuery = s.split("?")[0];
    const match = noQuery.match(/\/images\/I\/([^./?]+)\./);
    if (!match?.[1]) {
      return s;
    }
    const id = match[1];
    return `https://m.media-amazon.com/images/I/${id}._AC_SL1500_.jpg`;
  } catch {
    return s;
  }
}
