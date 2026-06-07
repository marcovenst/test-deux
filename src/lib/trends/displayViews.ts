export const VIEW_DISPLAY_MIN = 80;
export const VIEW_DISPLAY_RANGE = 920;

export function randomViewBaseline(): number {
  return VIEW_DISPLAY_MIN + Math.floor(Math.random() * VIEW_DISPLAY_RANGE);
}

/** Decorative baseline plus tracked cluster views from `cluster_views`. */
export function composeDisplayViews(baseline: number, realViews: number): number {
  return baseline + Math.max(0, realViews);
}

export function buildDisplayViews(realViews: number, baseline = randomViewBaseline()): number {
  return composeDisplayViews(baseline, realViews);
}
