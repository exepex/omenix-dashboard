// Fixture adapter of the Screener (story W12): W11's own contract examples (api/examples/blocks-33-34.json, taken from
// the signed-off 33-screener and 34-markets records and validated by the api-contract job). A paged block answers only
// the query its example was taken with (the example's own `x-query`); any other view is NoExample, never rows that
// belong to another query. A real adapter (the F&O tool's NSE ingest, the stock tool) replaces this one in wiring.ts.
import raw from "../fixtures/blocks-33-34.generated.json" with { type: "json" };
import { NoExample, exampleReader } from "../fixtures/examples.ts";
import type { Market } from "../data/constants.ts";
import { queryKey, type FnoQuery, type StocksQuery } from "./state.ts";
import type { ScreenerData } from "./source.ts";

const read = exampleReader(raw);

/** Every paged example with the query it answers (its `x-query`), symbols in a canonical order. */
const QUERIES: readonly [string, object][] = Object.entries(raw as Record<string, { "x-query"?: Record<string, unknown> }>)
  .filter(([, e]) => e["x-query"])
  .map(([op, e]) => [op, canonical(e["x-query"]!)]);
const STOCK_EXAMPLES = QUERIES as readonly [string, StocksQuery][];
const FNO_EXAMPLES = QUERIES as readonly [string, FnoQuery][];

/** A query with its symbols sorted (the route treats them as a set). */
function canonical<Q extends object>(q: Q): Q {
  const symbols = (q as { symbols?: string[] }).symbols;
  return symbols ? { ...q, symbols: [...symbols].sort() } : q;
}

function answer<Q extends object>(table: readonly [string, Q][], prefix: string, query: Q): string {
  const found = table.find(([op, q]) => op.startsWith(prefix) && queryKey(q) === queryKey(canonical(query)));
  if (!found) throw new NoExample(`${prefix} ${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)])).toString()}`);
  return found[0];
}

const stocksOp = (market: Market) => (market === "india" ? "getScreenerStocksIndia_india" : "getScreenerStocksUs_us");

export const fixtureScreenerData: ScreenerData = {
  summary: async (market) => read(market === "india" ? "getScreenerSummaryIndia_india" : "getScreenerSummaryUs_us"),
  stocks: async (market, query) => read(answer(STOCK_EXAMPLES, stocksOp(market), query)),
  tools: async (market) => read(`getScreenerTools_${market}`),
  fnoSummary: async () => read("getFnoScreenerSummary_india"),
  fnoRows: async (query) => read(answer(FNO_EXAMPLES, "getFnoScreenerRows_india", query)),
};
