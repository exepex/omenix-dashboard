// Home's adapter with the F&O tool's blocks (story W9-F&O; exepex/trading P10): India's session, the F&O books and the
// F&O expiry events from the F&O publication; every stock block (groups, trades, accounts, positions, attention,
// stock events, news, tracked moves, the US session) from the stock adapter, which stays the labelled examples until
// the stock tool publishes. The two are never combined into one figure.
import type { FnoBlockReader } from "../fno/blocks.ts";
import { payloadsOf } from "../fno/blocks.ts";
import type { HomeData } from "./source.ts";

export function fnoHomeData(reader: FnoBlockReader, stock: HomeData): HomeData {
  const payload = payloadsOf(reader);
  return {
    ...stock,
    session: (market) => (market === "india" ? payload("session") : stock.session(market)),
    fnoBooks: () => payload("risk"),
    fnoEvents: () => payload("events"),
  };
}
