// The Screener's adapter on the F&O product's publications (story W2; exepex/trading P6): India's summary, the day's
// stock table, the F&O summary and the F&O table, each from the current publication. The two tables are stored whole
// and served a page at a time by the route's query step. Blocks no backend publishes yet (the US screener, the stock
// tool's companies) are empty with that reason: never examples.
import { payloadsOf, type FnoBlockReader } from "../fno/blocks.ts";
import { noProducer } from "../ui/block-states.ts";
import type { FnoScreenerRow, ScreenerStock } from "./contract.ts";
import { pageFnoRows, pageStocks, type Table } from "./query-engine.ts";
import type { ScreenerData } from "./source.ts";

export function azureScreenerData(reader: FnoBlockReader): ScreenerData {
  const payload = payloadsOf(reader);
  return {
    summary: (market) => (market === "india" ? payload("screener_summary") : noProducer()),
    stocks: async (market, query) => (market === "india" ? pageStocks(await payload<Table<ScreenerStock>>("screener_stocks"), query) : noProducer()),
    tools: () => noProducer(),
    fnoSummary: () => payload("fno_screener_summary"),
    fnoRows: async (query) => pageFnoRows(await payload<Table<FnoScreenerRow>>("fno_screener_rows"), query),
  };
}
