// The Screener's blocks (story W12), as W11's contract types them (api/schemas/blocks-screener.yaml; signed-off
// 33-screener/notes.md). The Markets overview reads two of them too: its breadth is ScreenerSummary, its movers are
// pages of ScreenerStocks. Field names and units are the contract's: percent points, the market's currency, UTC.

/** % change on the close 1, 5, 21, 63 or 250 sessions back; null when listed later. */
export type PeriodChange = number | null;
export type Period = "d1" | "w1" | "m1" | "m3" | "y1";
export const PERIODS: readonly Period[] = ["d1", "w1", "m1", "m3", "y1"];

/** Counts over one universe's rows of the day. `delivery` is India only (absent in the US). */
export interface UniverseCounts {
  n: number;
  up: number;
  down: number;
  flat: number;
  high: number;
  near_high: number;
  low: number;
  near_low: number;
  up_1m: number;
  screens: { movers: number; volume: number; trend: number; fall: number; delivery?: number; oversold: number };
}

export type Universe = "all" | "n500" | "fno" | "ours";

/** GET /markets/{market}/screener/summary. India has every universe; the US only `ours`. */
export interface ScreenerSummary {
  as_of: string;
  universes: Partial<Record<Universe, UniverseCounts>>;
}

export interface ScreenerStock {
  s: string;
  n: string;
  /** Industry (Nifty 500 list only; empty for other stocks). */
  g: string;
  p: number;
  d1: PeriodChange;
  w1: PeriodChange;
  m1: PeriodChange;
  m3: PeriodChange;
  y1: PeriodChange;
  h: number | null;
  l: number | null;
  v: number;
  va: number | null;
  /** Delivery %. India only: absent in the US. */
  dl?: number | null;
  r: number | null;
  u: ("n500" | "fno" | "ours")[];
}

/** GET /markets/{market}/screener/stocks: one page of the day's rows, filtered and sorted by the route. */
export interface ScreenerStocks {
  as_of: string;
  currency: string;
  total: number;
  page: number;
  page_size: number;
  rows: ScreenerStock[];
}

export interface BuyOf {
  buy: number;
  of: number;
}

export interface ToolsCompany {
  s: string;
  strategies: { buy: number; of: number; by_family: Partial<Record<"rule" | "ai" | "baseline", BuyOf>> };
  prob_up: number | null;
  days_to_results: number | null;
}

/** GET /markets/{market}/screener/tools: the stock tool's view of the companies it follows. */
export interface ScreenerTools {
  as_of: string;
  horizon_days: number;
  companies: ToolsCompany[];
}

export type Buildup = "long_buildup" | "short_buildup" | "short_covering" | "long_unwinding";

/** GET /markets/india/fno/screener/summary (India only). */
export interface FnoScreenerSummary {
  as_of: string;
  n: number;
  expiry: string;
  buildups: Record<Buildup, number>;
  screens: { ivhigh: number; ivlow: number; oiup: number; index: number };
}

export interface FnoScreenerRow {
  s: string;
  n: string;
  kind: "stock" | "index";
  fut: number;
  fc: number | null;
  oi: number;
  oc: number | null;
  b: Buildup;
  iv: number | null;
  ivl: number | null;
  ivh: number | null;
  ivr: number | null;
  pcr: number | null;
  mv: number | null;
  x: string;
  lot: number;
}

/** GET /markets/india/fno/screener/rows (India only). */
export interface FnoScreenerRows {
  as_of: string;
  currency: string;
  total: number;
  page: number;
  page_size: number;
  rows: FnoScreenerRow[];
}
