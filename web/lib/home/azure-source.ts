// Home's adapter with exepex/trading's blocks (story W9-F&O, contract 2.5): India's session, the F&O books and the NSE
// F&O expiry calendar from the F&O publication; every stock block (groups, trades, accounts, positions, attention,
// stock events, news, tracked moves, the US session) from the stock adapter, which stays the labelled examples until
// the stock tool publishes. The two are never combined into one figure.
import type { FnoBlockReader } from "../fno/blocks.ts";
import { payloadsOf } from "../fno/blocks.ts";
import { FNO_PAGES } from "../fno/pages.ts";
import type { HomeData } from "./source.ts";

export function fnoHomeData(reader: FnoBlockReader, stock: HomeData): HomeData {
  const payload = payloadsOf(reader);
  return {
    ...stock,
    session: (market) => (market === "india" ? payload(FNO_PAGES.getSessionIndia) : stock.session(market)),
    fnoBooks: () => payload(FNO_PAGES.getFnoBooks),
    fnoEvents: () => payload(FNO_PAGES.getFnoEvents),
  };
}
