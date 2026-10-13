// The Markets overview's data interface (story W12): one method per W11 block it owns, plus its view of Home's events
// block (the next 12 of every kind) and the frame's session block. India-only blocks take no market, and the US-only rates take none either, so a
// market without them never asks.
import type { Market } from "../data/constants.ts";
import type { Events, Session } from "../home/contract.ts";
import type { Flows, IndiaSectors, OverviewIndices, Rates, UsSectors, World } from "./contract.ts";

export interface OverviewData {
  /** The frame's session block (the header's reading of the session). */
  session(market: Market): Promise<Session>;
  indices(market: Market): Promise<OverviewIndices>;
  indiaSectors(): Promise<IndiaSectors>;
  usSectors(): Promise<UsSectors>;
  flows(): Promise<Flows>;
  rates(): Promise<Rates>;
  world(market: Market): Promise<World>;
  events(market: Market): Promise<Events>;
  /** India only: exepex/trading's NSE F&O expiries (contract 2.5), merged with `events` by the page's query. */
  fnoEvents(): Promise<Events>;
}
