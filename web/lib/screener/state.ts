// The Screener's state in the URL (story W12; the signed-off page's hash keys as search parameters, so a view is a link
// and the server reads exactly the blocks it shows): tab, uni, pre, per, sort, pg, f, fopen, fpre, fsort. From the
// state come the route queries (W11: api/paths/blocks-screener.yaml). Pure.
import type { Market } from "../data/constants.ts";
import { PERIODS, type Period, type ScreenerTools, type Universe } from "./contract.ts";
import { fnoSortOf, isToolsScreen, screenDef, toolsSymbols, type FnoScreen, type StockScreen } from "./screens.ts";

export const PAGE_SIZE = 25;

/** The filters a reader sets (33 notes row 6), keyed as the page's URL keeps them. */
export const FILTERS = [
  ["pmin", "Price from"],
  ["pmax", "Price to"],
  ["cmin", "Change at least %"],
  ["vr", "Volume × usual at least"],
  ["dl", "Delivery at least %"],
  ["rmax", "RSI at most"],
] as const;
export type FilterKey = (typeof FILTERS)[number][0];

export interface ScreenerState {
  tab: "stocks" | "fno";
  uni: Universe;
  pre: StockScreen | "";
  per: Period;
  /** A column the reader chose; "" = the screen's own order. */
  sort: string;
  page: number;
  filters: Partial<Record<FilterKey, number>>;
  filtersOpen: boolean;
  fpre: FnoScreen | "";
  fsort: string;
}

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => (Array.isArray(p[k]) ? p[k]![0] : p[k]) ?? "";

/** The state of a URL's search parameters; anything unknown falls back to the default. The US has one universe and no
 *  F&O tab (absent). */
export function readState(p: Params, market: Market): ScreenerState {
  const india = market === "india";
  const uni = one(p, "uni") as Universe;
  const pre = one(p, "pre");
  const filters = Object.fromEntries(
    one(p, "f").split(",").map((x) => x.split(":")).filter(([k, v]) => FILTERS.some(([f]) => f === k) && v !== "" && Number.isFinite(Number(v))).map(([k, v]) => [k, Number(v)]),
  );
  if (!india) delete filters.dl;
  return {
    tab: india && one(p, "tab") === "fno" ? "fno" : "stocks",
    uni: !india ? "ours" : ["n500", "fno", "ours"].includes(uni) ? uni : "all",
    pre: screenDef(pre) && (india || !screenDef(pre)!.india) ? (pre as StockScreen) : "",
    per: (PERIODS as readonly string[]).includes(one(p, "per")) ? (one(p, "per") as Period) : "m1",
    sort: one(p, "sort"),
    page: Math.max(1, Math.floor(Number(one(p, "pg")) || 1)),
    filters,
    filtersOpen: one(p, "fopen") === "1",
    fpre: (one(p, "fpre") as FnoScreen) || "",
    fsort: one(p, "fsort"),
  };
}

/** The search string of a state (only what differs from the default), for links and the controls. */
export function stateSearch(s: ScreenerState): string {
  const q = new URLSearchParams();
  if (s.tab !== "stocks") q.set("tab", s.tab);
  if (s.uni !== "all") q.set("uni", s.uni);
  if (s.pre) q.set("pre", s.pre);
  if (s.per !== "m1") q.set("per", s.per);
  if (s.sort) q.set("sort", s.sort);
  if (s.page > 1) q.set("pg", String(s.page));
  const f = Object.entries(s.filters).map(([k, v]) => `${k}:${v}`).join(",");
  if (f) q.set("f", f);
  if (s.filtersOpen) q.set("fopen", "1");
  if (s.fpre) q.set("fpre", s.fpre);
  if (s.fsort) q.set("fsort", s.fsort);
  const t = q.toString();
  return t ? `?${t}` : "";
}

/** The stocks route's query (W11): universe, screen, period, filters, symbols, sort, page. */
export interface StocksQuery {
  u: Universe;
  screen?: string;
  period?: Period;
  pmin?: number;
  pmax?: number;
  cmin?: number;
  vrmin?: number;
  dlmin?: number;
  rmax?: number;
  vamin?: number;
  symbols?: string[];
  sort: string;
  page: number;
  page_size: number;
}

/** The rows' order: the reader's column, else the screen's own, else value traded. */
export const sortOf = (s: ScreenerState) => s.sort || (s.pre ? screenDef(s.pre)!.sort : "value");

export function stocksQuery(s: ScreenerState, tools: ScreenerTools | null): StocksQuery {
  const f = s.filters;
  const sort = sortOf(s);
  const tooled = s.pre && isToolsScreen(s.pre);
  return clean({
    u: s.uni,
    screen: s.pre && !tooled ? s.pre : undefined,
    symbols: tooled && tools ? toolsSymbols(tools, s.pre as "picks" | "results") : undefined,
    period: f.cmin !== undefined || sort.replace("-", "") === "chg" ? s.per : undefined,
    pmin: f.pmin,
    pmax: f.pmax,
    cmin: f.cmin,
    vrmin: f.vr,
    dlmin: f.dl,
    rmax: f.rmax,
    sort,
    page: s.page,
    page_size: PAGE_SIZE,
  });
}

/** The F&O rows route's query (India only). */
export interface FnoQuery {
  screen?: string;
  symbols?: string[];
  sort: string;
  page: number;
  page_size: number;
}

export const fnoQuery = (s: ScreenerState): FnoQuery => clean({ screen: s.fpre || undefined, sort: s.fsort || fnoSortOf(s.fpre), page: s.page, page_size: PAGE_SIZE });

/** A query without its unset keys (so equal queries compare equal). */
function clean<T extends object>(q: T): T {
  return Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined)) as T;
}

/** A query as one comparable string, keys sorted. */
export const queryKey = (q: object) => JSON.stringify(Object.entries(q).sort(([a], [b]) => (a < b ? -1 : 1)));
