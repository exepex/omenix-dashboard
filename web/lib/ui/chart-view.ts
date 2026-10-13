// The visible window of a price chart (story W14): which of a series' n points show, after zoom and pan. Pure, so
// every price chart zooms the same way (components/charts/zoom.tsx draws the controls and reads the gestures).
// A window is [start, end) over point indexes; it always holds at least MIN_POINTS points (or all of them when the
// series is shorter) and never leaves the series.

export interface ChartWindow {
  start: number;
  end: number;
}

export const MIN_POINTS = 5;
export const ZOOM_STEP = 1.5;

const minSpan = (n: number) => Math.min(n, MIN_POINTS);

/** Keep a window inside [0, n) with at least the minimum span, keeping its span when it slides back in. */
export function clampWindow(w: ChartWindow, n: number): ChartWindow {
  if (n <= 0) return { start: 0, end: 0 };
  const span = Math.max(minSpan(n), Math.min(n, Math.round(w.end - w.start)));
  const start = Math.max(0, Math.min(n - span, Math.round(w.start)));
  return { start, end: start + span };
}

/** The window a chart opens on: the last `initial` points (all when not given or longer than the series). */
export const initialWindow = (n: number, initial?: number): ChartWindow => clampWindow({ start: n - (initial ?? n), end: n }, n);

/** Zoom by `factor` (> 1 zooms in) around a point given as a fraction of the window's width (0 = left edge,
 *  1 = right edge): the point under the pointer stays where it is. */
export function zoomWindow(w: ChartWindow, n: number, factor: number, at = 0.5): ChartWindow {
  const span = w.end - w.start;
  const next = Math.max(minSpan(n), Math.min(n, Math.round(span / factor)));
  if (next === span) return w;
  const anchor = w.start + at * span;
  return clampWindow({ start: anchor - at * next, end: anchor - at * next + next }, n);
}

/** Pan by `points` (positive moves later in time, toward the newest point). */
export const panWindow = (w: ChartWindow, n: number, points: number): ChartWindow => clampWindow({ start: w.start + points, end: w.end + points }, n);

export const isWhole = (w: ChartWindow, n: number): boolean => w.start === 0 && w.end === n;
export const canZoomIn = (w: ChartWindow, n: number): boolean => w.end - w.start > minSpan(n);
export const showsNewest = (w: ChartWindow, n: number): boolean => w.end === n;

/** The index of the point under a fraction of the window's width (0..1), inside the window. */
export function indexAt(w: ChartWindow, fraction: number): number {
  const span = w.end - w.start;
  return Math.max(w.start, Math.min(w.end - 1, w.start + Math.floor(Math.max(0, Math.min(0.9999, fraction)) * span)));
}

/** The zoom factor of a wheel turn: one notch (deltaY ±100) is one step; trackpads send smaller deltas. */
export const wheelFactor = (deltaY: number): number => Math.pow(ZOOM_STEP, -Math.max(-3, Math.min(3, deltaY / 100)));

/** The zoom factor of a pinch: how much farther apart the two fingers are now than when they last moved. */
export const pinchFactor = (before: number, now: number): number => (before > 0 && now > 0 ? now / before : 1);
