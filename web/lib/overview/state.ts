// The Markets overview's state in the URL (story W12; the signed-off page's hash keys as search parameters): per, idx,
// br, sec, mov, mu. The movers are pages of the Screener's stocks block, asked with the route's own query. Pure.
import type { Market } from "../data/constants.ts";
import { PERIODS, type Period } from "../screener/contract.ts";
import type { StocksQuery } from "../screener/state.ts";

export interface MarketsState {
  per: Period;
  /** The index charted in the main card (by name); "" = the first broad index. */
  idx: string;
  br: "all" | "n500";
  sec: "index" | "industry";
  mov: "gainers" | "losers" | "active";
  mu: "n500" | "all";
}

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => (Array.isArray(p[k]) ? p[k]![0] : p[k]) ?? "";

export function readMarketsState(p: Params): MarketsState {
  const mov = one(p, "mov");
  return {
    per: (PERIODS as readonly string[]).includes(one(p, "per")) ? (one(p, "per") as Period) : "m1",
    idx: one(p, "idx"),
    br: one(p, "br") === "n500" ? "n500" : "all",
    sec: one(p, "sec") === "industry" ? "industry" : "index",
    mov: mov === "losers" || mov === "active" ? mov : "gainers",
    mu: one(p, "mu") === "all" ? "all" : "n500",
  };
}

export function marketsSearch(s: MarketsState): string {
  const q = new URLSearchParams();
  if (s.per !== "m1") q.set("per", s.per);
  if (s.idx) q.set("idx", s.idx);
  if (s.br !== "all") q.set("br", s.br);
  if (s.sec !== "index") q.set("sec", s.sec);
  if (s.mov !== "gainers") q.set("mov", s.mov);
  if (s.mu !== "n500") q.set("mu", s.mu);
  const t = q.toString();
  return t ? `?${t}` : "";
}

const MOVER_SORT = { gainers: "d1", losers: "-d1", active: "value" } as const;

/** The movers list's query: India 8 rows of the Nifty 500, or of all NSE stocks that usually trade 1,00,000+ shares at
 *  ₹20+ (so a one-trade jump cannot top it); the US 5 rows of its 20 companies. */
export function moversQuery(s: MarketsState, market: Market): StocksQuery {
  if (market !== "india") return { u: "ours", sort: MOVER_SORT[s.mov], page: 1, page_size: 5 };
  return s.mu === "all"
    ? { u: "all", vamin: 100000, pmin: 20, sort: MOVER_SORT[s.mov], page: 1, page_size: 8 }
    : { u: "n500", sort: MOVER_SORT[s.mov], page: 1, page_size: 8 };
}
