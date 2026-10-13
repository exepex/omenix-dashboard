// The Markets overview's words and small readings (story W12; 34-markets/notes.md), from block fields only: the closes
// a period's chart shows, the VIX's 3-month middle (the median of its last 63 closes, as the contract defines), the
// curve's shape, the sector tiles' shade and the flows' coverage. Nothing adds money or mixes series. Pure.
import type { Period } from "../screener/contract.ts";
import type { FlowTotal, OverviewQuote } from "./contract.ts";

export const PERIOD_LABEL: Record<Period, string> = { d1: "1D", w1: "1W", m1: "1M", m3: "3M", y1: "1Y" };
export const PERIOD_WORDS: Record<Period, string> = { d1: "today", w1: "this week", m1: "this month", m3: "in 3 months", y1: "in a year" };
/** Sessions a period's chart spans (1D shows the last week, as signed off). */
const SPAN: Record<Period, number> = { d1: 5, w1: 5, m1: 21, m3: 63, y1: 250 };

export const REGIME: Record<string, string> = { CALM: "Calm market", TRENDING: "Trending market", EVENT_HEAVY: "Event-heavy session", UNSTABLE: "Unstable market" };

/** The closes a period's chart draws (the last one is `close`). */
export const periodCloses = (q: OverviewQuote, per: Period, atLeast = 0) => q.closes.slice(-1 - Math.max(SPAN[per], atLeast));

/** A volatility series, where up is not good: drawn in the neutral colour. */
export const isVolatility = (q: OverviewQuote) => q.kind === "vol" || q.kind === "vol_index" || /VIX/.test(q.name);

/** The median of the last 63 closes: the VIX's "3-month middle". */
export function middle63(q: OverviewQuote): number {
  const xs = q.closes.slice(-63).filter((x): x is number => x !== null).sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}

/** Where the close sits between the 52-week low (0%) and high (100%). */
export const pos52 = (q: OverviewQuote) => (q.hi52 !== null && q.lo52 !== null && q.hi52 > q.lo52 ? Math.round(((q.close - q.lo52) / (q.hi52 - q.lo52)) * 100) : null);

/** A sector tile's shade: its sign, and its size against the period's usual moves. */
export function tone(v: number | null, per: Period): string {
  if (v === null) return "";
  const [big, mid] = per === "d1" ? [2, 1] : per === "w1" ? [4, 2] : [8, 4];
  return `${v >= 0 ? "up" : "down"} ${Math.abs(v) >= big ? "s3" : Math.abs(v) >= mid ? "s2" : "s1"}`;
}

/** The flows' period total, or why there is none: a total exists only when the days cover the whole period. */
export const coverage = (t: FlowTotal) => (t.complete ? null : `only ${t.days} day${t.days === 1 ? "" : "s"} of data for ${t.days_in_period} sessions`);

/** The yield curve in words: 10-year against 2-year. */
export const curveWords = (y10: number, y2: number) => (y10 > y2 ? "longer loans pay more (a normal curve)" : "shorter loans pay more (an inverted curve, often read as a slowdown warning)");

/** "What is coming?": each event kind's words and icon, as the signed-off page shows them. */
const ECONOMY: [string, string] = ["Economy", "public"];
export const EVENT_KIND: Record<string, [string, string]> = {
  earnings: ["Results", "event"],
  ex_dividend: ["Ex-dividend", "payments"],
  fno_expiry: ["F&O expiry", "layers"],
  weekly_expiry: ["F&O expiry", "layers"],
  filing: ["Filing", "description"],
  periodic_report: ["Filing", "description"],
  rbi_policy: ECONOMY,
  fomc: ECONOMY,
  cpi: ECONOMY,
  jobs_report: ECONOMY,
  budget: ECONOMY,
  macro: ECONOMY,
};
