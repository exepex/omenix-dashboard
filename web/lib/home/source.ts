// Home's data interface (story W9, design for change): one method per block of W10's contract, so each section loads
// on its own and a backend can fill one block at a time. Components never see an adapter; the market page's loaders
// read this interface through lib/home/wiring.ts.
import type { Market } from "../data/constants.ts";
import type { Accounts, Attention, Events, FnoBooks, Groups, Positions, Session, StrategyTrades, TopNews, TrackedMoves } from "./contract.ts";

export interface HomeData {
  session(market: Market): Promise<Session>;
  trackedMoves(market: Market): Promise<TrackedMoves>;
  accounts(market: Market): Promise<Accounts>;
  positions(market: Market): Promise<Positions>;
  groups(market: Market): Promise<Groups>;
  strategyTrades(market: Market): Promise<StrategyTrades>;
  attention(market: Market): Promise<Attention>;
  events(market: Market): Promise<Events>;
  topNews(market: Market): Promise<TopNews>;
  /** India only: F&O exists in no other market, so there is no market parameter. */
  fnoBooks(): Promise<FnoBooks>;
}
