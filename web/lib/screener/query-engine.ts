// The route's step over a published table (story W2; W11: "one page of the day's rows, filtered and sorted by the route
// over the published table"): P6 stores the whole day's stock and F&O tables, and a real adapter serves the page a query
// asks for. The same semantics as the contract's reference route (tools/api/screener_route.py, with which W11's examples
// were built; P6 checks its tables with a port of it): the screens are 33-screener/notes.md rows 4 and 10; empty values
// sort last in either direction; ties go by value traded (open interest in rupees for F&O), then by symbol, never by the
// stored order. Proved against every W11 example by tests/query-engine.test.ts. Pure.
import type { FnoScreenerRow, FnoScreenerRows, ScreenerStock, ScreenerStocks } from "./contract.ts";
import type { FnoQuery, StocksQuery } from "./state.ts";

/** A stored table: every row of the day, no page (W11 ScreenerStocksTable, FnoScreenerTable). */
export interface Table<R> {
  as_of: string;
  currency: string;
  total: number;
  rows: R[];
}

type Value = number | null | undefined;
const ratio = (r: ScreenerStock) => (r.va ? r.v / r.va : null);
const position = (r: ScreenerStock) => (r.h && r.l !== null && r.h > r.l ? (r.p - r.l) / (r.h - r.l) : null);

const STOCK_SCREENS: Record<string, (r: ScreenerStock) => boolean> = {
  high: (r) => !!r.h && r.p >= r.h * 0.98,
  low: (r) => !!r.l && r.p <= r.l * 1.02,
  movers: (r) => Math.abs(r.d1 ?? 0) >= 5,
  volume: (r) => (r.va ?? 0) >= 5e4 && r.v >= 3 * (r.va ?? 0),
  trend: (r) => (r.m1 ?? 0) >= 10,
  fall: (r) => (r.m1 ?? 0) <= -10,
  delivery: (r) => (r.dl ?? 0) >= 70 && (r.va ?? 0) >= 1e5,
  oversold: (r) => r.r !== null && r.r < 30,
};

function stockValue(r: ScreenerStock, key: string, q: StocksQuery): Value {
  switch (key) {
    case "value": return r.p * r.v;
    case "chg": return r[q.period ?? "m1"];
    case "pos": return position(r);
    case "abs": return Math.abs(r.d1 ?? 0);
    case "vr": return ratio(r);
    default: return (r as unknown as Record<string, Value>)[key];
  }
}

function keepStock(r: ScreenerStock, q: StocksQuery, symbols: Set<string> | null): boolean {
  return (q.u === "all" || r.u.includes(q.u))
    && (!q.screen || STOCK_SCREENS[q.screen]?.(r) === true)
    && (!symbols || symbols.has(r.s))
    && (q.pmin === undefined || r.p >= q.pmin) && (q.pmax === undefined || r.p <= q.pmax)
    && (q.cmin === undefined || (r[q.period ?? "m1"] ?? -Infinity) >= q.cmin)
    && (q.vrmin === undefined || (ratio(r) ?? 0) >= q.vrmin)
    && (q.dlmin === undefined || (r.dl ?? 0) >= q.dlmin)
    && (q.rmax === undefined || (r.r ?? Infinity) <= q.rmax)
    && (q.vamin === undefined || (r.va ?? 0) >= q.vamin);
}

/** Rows sorted by a key ("-" first = ascending), empty values last either way, ties by `tie` (descending), then symbol. */
function sorted<R extends { s: string }>(rows: R[], sort: string, value: (r: R, key: string) => Value, tie: (r: R) => number): R[] {
  const asc = sort.startsWith("-");
  const key = asc ? sort.slice(1) : sort;
  return rows.map((r) => ({ r, v: value(r, key) })).sort((a, b) => {
    const an = a.v === null || a.v === undefined, bn = b.v === null || b.v === undefined;
    if (an !== bn) return an ? 1 : -1;
    const d = an ? 0 : asc ? (a.v as number) - (b.v as number) : (b.v as number) - (a.v as number);
    return d || tie(b.r) - tie(a.r) || (a.r.s < b.r.s ? -1 : a.r.s > b.r.s ? 1 : 0);
  }).map((x) => x.r);
}

function paged<R>(table: Table<R>, rows: R[], page: number, size: number) {
  return { as_of: table.as_of, currency: table.currency, total: rows.length, page, page_size: size, rows: rows.slice((page - 1) * size, page * size) };
}

export function pageStocks(table: Table<ScreenerStock>, q: StocksQuery): ScreenerStocks {
  const symbols = q.symbols ? new Set(q.symbols) : null;
  const kept = table.rows.filter((r) => keepStock(r, q, symbols));
  return paged(table, sorted(kept, q.sort, (r, k) => stockValue(r, k, q), (r) => r.p * r.v), q.page, q.page_size);
}

const FNO_SCREENS: Record<string, (r: FnoScreenerRow) => boolean> = {
  long_buildup: (r) => r.b === "long_buildup",
  short_buildup: (r) => r.b === "short_buildup",
  short_covering: (r) => r.b === "short_covering",
  long_unwinding: (r) => r.b === "long_unwinding",
  ivhigh: (r) => (r.ivr ?? 0) >= 80,
  ivlow: (r) => r.ivr !== null && r.ivr <= 20,
  oiup: (r) => (r.oc ?? 0) >= 5,
  index: (r) => r.kind === "index",
};

export function pageFnoRows(table: Table<FnoScreenerRow>, q: FnoQuery): FnoScreenerRows {
  const symbols = q.symbols ? new Set(q.symbols) : null;
  const kept = table.rows.filter((r) => (!q.screen || FNO_SCREENS[q.screen]?.(r) === true) && (!symbols || symbols.has(r.s)));
  const oiValue = (r: FnoScreenerRow) => r.oi * r.fut;
  const value = (r: FnoScreenerRow, k: string): Value => (k === "oi" ? oiValue(r) : (r as unknown as Record<string, Value>)[k]);
  return paged(table, sorted(kept, q.sort, value, oiValue), q.page, q.page_size);
}
