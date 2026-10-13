// The Screener's data interface (story W12): one method per W11 block, so each part of the page loads on its own and a
// backend is one new adapter (wiring.ts). The F&O blocks take no market: F&O exists for India only. A query no data
// answers rejects with NoExample (lib/ui/no-example.ts), which the page shows as such.
import type { Market } from "../data/constants.ts";
import type { FnoScreenerRows, FnoScreenerSummary, ScreenerStocks, ScreenerSummary, ScreenerTools } from "./contract.ts";
import type { FnoQuery, StocksQuery } from "./state.ts";

export interface ScreenerData {
  summary(market: Market): Promise<ScreenerSummary>;
  stocks(market: Market, query: StocksQuery): Promise<ScreenerStocks>;
  tools(market: Market): Promise<ScreenerTools>;
  fnoSummary(): Promise<FnoScreenerSummary>;
  fnoRows(query: FnoQuery): Promise<FnoScreenerRows>;
}
