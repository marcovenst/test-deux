/** Lower rank = preferred for hero media (surface variety; YouTube last). */
export function socialSourceUrlRank(sourceUrl: string): number {
  const u = sourceUrl.toLowerCase();
  if (u.includes("tiktok.com")) return 0;
  if (u.includes("twitter.com") || u.includes("x.com")) return 1;
  if (u.includes("instagram.com")) return 2;
  if (u.includes("facebook.com") || u.includes("fb.watch") || u.includes("fb.com")) return 3;
  if (u.includes("youtube.com") || u.includes("youtu.be")) return 10;
  return 5;
}

type SourceLike = {
  sourceUrl: string;
  embedUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
};

export function pickFeaturedVideoSource<T extends SourceLike>(sources: T[]): T | null {
  const withVideo = sources.filter((s) => s.embedUrl || s.videoUrl);
  if (withVideo.length === 0) return null;
  return [...withVideo].sort(
    (a, b) => socialSourceUrlRank(a.sourceUrl) - socialSourceUrlRank(b.sourceUrl),
  )[0]!;
}

export function pickFeaturedImageSource<T extends SourceLike>(sources: T[]): T | null {
  const withImage = sources.filter((s) => s.imageUrl && !s.embedUrl && !s.videoUrl);
  if (withImage.length === 0) return null;
  return [...withImage].sort(
    (a, b) => socialSourceUrlRank(a.sourceUrl) - socialSourceUrlRank(b.sourceUrl),
  )[0]!;
}
