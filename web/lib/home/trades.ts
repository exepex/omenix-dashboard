// Home's open paper trades (story W9; 31 notes.md row 5): your own trades first, then each family's trades grouped per
// stock. Each strategy is its own experiment, so a group shows each trade's own profit or loss (one value, or the
// range when they differ), never a sum. Pure.
import type { OwnPosition, StrategyTrade } from "./contract.ts";

export type Owner = "manual" | StrategyTrade["family"];
export type Tab = "all" | Owner;
export const TABS: readonly [Tab, string][] = [["all", "All"], ["manual", "Yours"], ["rule", "Rule-based"], ["hybrid", "Hybrid"], ["ai", "AI team"], ["baseline", "Baselines"]];
export const TRADES_PAGE = 6;

/** A strategy trade with its index in the StrategyTrades block (the source of every figure its row shows). */
export interface Entry {
  trade: StrategyTrade;
  at: number;
}

export type TradeRow =
  | { kind: "own"; family: "manual"; id: string; position: OwnPosition; at: number }
  | { kind: "group"; family: StrategyTrade["family"]; id: string; entries: Entry[] };

const uniq = <T>(xs: readonly T[]) => [...new Set(xs)];

/** Your trades, then one row per (stock, family), in the order the block lists them. */
export function tradeRows(own: readonly OwnPosition[], trades: readonly StrategyTrade[]): TradeRow[] {
  const groups = new Map<string, Extract<TradeRow, { kind: "group" }>>();
  trades.forEach((trade, at) => {
    const key = `${trade.id}|${trade.family}`;
    const g = groups.get(key) ?? { kind: "group" as const, family: trade.family, id: trade.id, entries: [] };
    g.entries.push({ trade, at });
    groups.set(key, g);
  });
  return [...own.map((position, at) => ({ kind: "own" as const, family: "manual" as const, id: position.id, position, at })), ...groups.values()];
}

export const rowsOf = (rows: readonly TradeRow[], tab: Tab) => rows.filter((r) => tab === "all" || r.family === tab);

/** A group's figures, each one a trade's own value with the block index it comes from: strategies, horizons, exit
 *  dates, the amount of one trade, and the profit or loss of one trade (`same` when all are equal, else `low` and
 *  `high`). Nothing is summed. */
export function groupFigures(entries: readonly Entry[]) {
  const trades = entries.map((e) => e.trade);
  const byValue = (pick: (xs: number[]) => number) => {
    const v = pick(trades.map((t) => t.unrealised));
    return entries.find((e) => e.trade.unrealised === v) as Entry;
  };
  const low = byValue((xs) => Math.min(...xs));
  const high = byValue((xs) => Math.max(...xs));
  return {
    strategies: uniq(trades.map((t) => t.strategy)),
    horizons: uniq(trades.map((t) => t.horizon)),
    exits: uniq(trades.map((t) => t.exit)).sort(),
    amount: entries[0],
    /** One entry when every trade shows the same result, else null (the row shows low to high). */
    same: low.trade.unrealised === high.trade.unrealised ? low : null,
    low,
    high,
    /** The one trade's return in percent, shown only for a single trade. */
    pct: trades.length === 1 ? (trades[0].unrealised / trades[0].amount) * 100 : null,
  };
}

/** A position's return on its cost, percent. */
export const ownPct = (p: OwnPosition) => (p.unrealised / (p.avg * Math.abs(p.qty))) * 100;
