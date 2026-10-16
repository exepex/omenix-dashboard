// Fixture adapter of Home (story W9): the W10 contract's own block examples (api/examples/blocks.json, taken from the
// signed-off 30-shell and 31-dashboard records and validated against the schemas by the api-contract job), copied
// unchanged into lib/fixtures/blocks.generated.json by tools/sync-design.mjs. Each block is its envelope's payload. A real
// adapter (W2, W6) replaces this one in wiring.ts.
import raw from "../fixtures/blocks.generated.json" with { type: "json" };
import type { Market } from "../data/constants.ts";
import { exampleReader } from "../fixtures/examples.ts";
import type { HomeData } from "./source.ts";

/** The payload of one example (`getGroups_india`), strategy names through the display-name rule; a missing example is
 *  a broken fixture, never an empty block. */
export const example = exampleReader(raw, { strategies: true });

const block = <T>(operation: string) => async (market: Market): Promise<T> => example<T>(`${operation}_${market}`);

export const fixtureHomeData: HomeData = {
  session: async (market) => example(market === "india" ? "getSessionIndia_india" : "getSessionUs_us"),
  trackedMoves: block("getTrackedMoves"),
  accounts: block("getAccounts"),
  positions: block("getPositions"),
  groups: block("getGroups"),
  strategyTrades: block("getStrategyTrades"),
  attention: block("getAttention"),
  events: block("getEvents"),
  topNews: block("getTopNews"),
  fnoBooks: async () => example("getFnoBooks_india"),
  fnoEvents: async () => example("getFnoEvents_india"),
  /** The examples publish normally: no page is held (the W3 screens' fixtures say the same). */
  fnoHolds: async () => ({ holds: [] }),
};
