export function nextFeedVisibleCount(current: number, total: number, chunkSize: number): number {
  if (current >= total) {
    return current;
  }
  return Math.min(total, current + chunkSize);
}
