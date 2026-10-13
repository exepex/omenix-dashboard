// Fixture adapter of the Screener (story W12): W11's own contract examples (api/examples/blocks-33-34.json, taken from
// the signed-off 33-screener and 34-markets records and validated by the api-contract job). A paged block answers only
// the query its example was taken with (each example's summary names it); any other view is NoExample, never rows that
// belong to another query. A real adapter (the F&O tool's NSE ingest, the stock tool) replaces this one in wiring.ts.
import raw from "../fixtures/blocks-33-34.generated.json" with { type: "json" };
import { NoExample, exampleReader } from "../fixtures/examples.ts";
import type { Market } from "../data/constants.ts";
import { INDEX_OPTIONS } from "./screens.ts";
import { queryKey, type FnoQuery, type StocksQuery } from "./state.ts";
import type { ScreenerData } from "./source.ts";

const read = exampleReader(raw);
const PAGE = { page: 1, page_size: 25 };

/** The stock queries the examples answer, by example. */
const STOCK_EXAMPLES: readonly [string, StocksQuery][] = [
  ["getScreenerStocksIndia_india", { u: "all", sort: "value", ...PAGE }],
  ["getScreenerStocksIndia_india_high", { u: "all", screen: "high", sort: "pos", ...PAGE }],
  ["getScreenerStocksIndia_india_gainers", { u: "n500", sort: "d1", page: 1, page_size: 8 }],
  ["getScreenerStocksUs_us", { u: "ours", sort: "value", ...PAGE }],
  ["getScreenerStocksUs_us_gainers", { u: "ours", sort: "d1", page: 1, page_size: 5 }],
];

const FNO_EXAMPLES: readonly [string, FnoQuery][] = [
  ["getFnoScreenerRows_india", { sort: "oi", ...PAGE }],
  ["getFnoScreenerRows_india_index_options", { symbols: INDEX_OPTIONS, sort: "oi", ...PAGE }],
];

function answer<Q extends object>(table: readonly [string, Q][], prefix: string, query: Q): string {
  const found = table.find(([op, q]) => op.startsWith(prefix) && queryKey(q) === queryKey(query));
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
