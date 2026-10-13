// The Screener's ready-made screens and F&O build-ups (story W12; 33-screener/notes.md rows 4, 9 and 10), with the
// words the signed-off page shows and where each count comes from. Every count is a field of the summary block, except
// the two tools-based screens, which the contract counts over the tools block's companies (notes row 4). Pure.
import type { Buildup, ScreenerTools, ToolsCompany, Universe, UniverseCounts } from "./contract.ts";

export type StockScreen = "high" | "low" | "movers" | "volume" | "trend" | "fall" | "delivery" | "oversold" | "picks" | "results";

export interface ScreenDef {
  key: StockScreen;
  label: string;
  tip: string;
  /** The rows' order when the screen is on (a sort the route takes). */
  sort: string;
  /** The count's field within a universe's counts; null for the tools-based screens. */
  field: string | null;
  india?: boolean;
}

export const STOCK_SCREENS: readonly ScreenDef[] = [
  { key: "high", label: "Near 52-week high", tip: "Closed within 2% of its highest price of the last year", sort: "pos", field: "near_high" },
  { key: "low", label: "Near 52-week low", tip: "Closed within 2% of its lowest price of the last year", sort: "-pos", field: "near_low" },
  { key: "movers", label: "Big moves today", tip: "Up or down 5% or more today", sort: "abs", field: "screens.movers" },
  { key: "volume", label: "Volume 3× usual", tip: "Traded at least 3 times its 20-day average volume (and usually 50,000 shares or more)", sort: "vr", field: "screens.volume" },
  { key: "trend", label: "Up 10%+ in a month", tip: "Gained 10% or more over the last 21 sessions", sort: "m1", field: "screens.trend" },
  { key: "fall", label: "Down 10%+ in a month", tip: "Lost 10% or more over the last 21 sessions", sort: "-m1", field: "screens.fall" },
  { key: "delivery", label: "High delivery (70%+)", tip: "At least 70% of the shares traded were taken for keeping, not traded within the day (usually 1,00,000 shares or more)", sort: "dl", field: "screens.delivery", india: true },
  { key: "oversold", label: "RSI under 30", tip: "Fell fast lately (RSI 14 below 30). Often read as oversold; not a buy signal on its own", sort: "-r", field: "screens.oversold" },
  { key: "picks", label: "Our strategies: 3+ buy", tip: "The stock tool’s strategies that buy it for the next 5 sessions (only the companies the tools follow)", sort: "value", field: null },
  { key: "results", label: "Results within 7 days", tip: "Quarterly results due within 7 days (only the companies the tools follow)", sort: "value", field: null },
];

/** The screens of a market: delivery is India only. */
export const screensOf = (india: boolean) => STOCK_SCREENS.filter((s) => india || !s.india);
export const screenDef = (key: string) => STOCK_SCREENS.find((s) => s.key === key);

/** The two tools-based screens, as the contract defines them over the followed companies. */
const TOOLS_TEST: Record<"picks" | "results", (c: ToolsCompany) => boolean> = {
  picks: (c) => c.strategies.buy >= 3,
  results: (c) => c.days_to_results !== null && c.days_to_results <= 7,
};

/** The followed companies a tools-based screen keeps (the route's `symbols`). */
export const toolsSymbols = (tools: ScreenerTools, key: "picks" | "results") => tools.companies.filter(TOOLS_TEST[key]).map((c) => c.s);

export const isToolsScreen = (key: string): key is "picks" | "results" => key === "picks" || key === "results";

/** A screen's count in a universe, and its source path in the summary block (null for the tools-based screens). */
export function screenCount(def: ScreenDef, uni: Universe, counts: UniverseCounts, tools: ScreenerTools): { n: number; path: string | null } {
  if (!def.field) return { n: toolsSymbols(tools, def.key as "picks" | "results").length, path: null };
  const n = def.field.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown>)[k], counts) as number;
  return { n, path: `universes.${uni}.${def.field}` };
}

export const BUILDUPS: readonly [Buildup, string, string, string, string][] = [
  ["long_buildup", "Long build-up", "success", "trending_up", "Price up, open interest up: new buyers"],
  ["short_buildup", "Short build-up", "danger", "trending_down", "Price down, open interest up: new sellers"],
  ["short_covering", "Short covering", "info", "trending_up", "Price up, open interest down: sellers closing"],
  ["long_unwinding", "Long unwinding", "warn", "trending_down", "Price down, open interest down: buyers closing"],
];
export const buildupOf = (b: Buildup) => BUILDUPS.find((x) => x[0] === b)!;

export type FnoScreen = Buildup | "ivhigh" | "ivlow" | "oiup" | "index";

/** The F&O screens beyond the build-up tiles: label, tip, default sort, count field in the F&O summary. */
export const FNO_SCREENS: readonly [FnoScreen, string, string, string, string][] = [
  ["ivhigh", "IV near its 3-month high", "ATM IV in the top fifth of its 3-month range: options cost more than usual", "ivr", "screens.ivhigh"],
  ["ivlow", "IV near its 3-month low", "ATM IV in the bottom fifth of its 3-month range: options cost less than usual", "-ivr", "screens.ivlow"],
  ["oiup", "Open interest up 5%+", "Futures open interest rose 5% or more today", "oc", "screens.oiup"],
  ["index", "Indices", "NIFTY, BANKNIFTY and the other index contracts", "oi", "screens.index"],
];

/** The default order of an F&O screen (build-ups by open interest change). */
export const fnoSortOf = (screen: string) => FNO_SCREENS.find((s) => s[0] === screen)?.[3] ?? (screen ? "oc" : "oi");

/** The Markets overview's index options: the four index underlyings that trade (34 notes, decision 5). */
export const INDEX_OPTIONS = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"];

/** The tools-based screens' own order (33: picks by strategies buying, most first; results soonest first), which the
 *  route cannot sort by (it is the tools block's data): applied on the page to the screen's at most 20 rows, keeping
 *  each row's index in the block (its figures' source). Ties go by symbol, as the signed-off pictures show them. */
export function toolsOrder<R extends { s: string }>(rows: readonly R[], tools: ScreenerTools, key: "picks" | "results"): { r: R; i: number }[] {
  const by = new Map(tools.companies.map((c) => [c.s, c]));
  const value = (s: string) => (key === "picks" ? -(by.get(s)?.strategies.buy ?? 0) : (by.get(s)?.days_to_results ?? Infinity));
  return rows.map((r, i) => ({ r, i })).sort((a, b) => value(a.r.s) - value(b.r.s) || a.r.s.localeCompare(b.r.s));
}

export const TOOLS_ORDER_WORDS: Record<"picks" | "results", string> = { picks: "strategies buying", results: "soonest results" };
