// Home's open paper trades (story W9; 31 notes.md row 5): your own trades first, then each family's trades grouped per
// stock. Each strategy is its own experiment, so a group shows each trade's own profit or loss (one value, or the
// range when they differ), never a sum. Pure.
import type { OwnPosition, StrategyTrade } from "./contract.ts";

export type Owner = "manual" | StrategyTrade["family"];
export type Tab = "all" | Owner;
export const TABS: readonly [Tab, string][] = [["all", "All"], ["manual", "Yours"], ["rule", "Rule-based"], ["hybrid", "Hybrid"], ["ai", "AI team"], ["baseline", "Baselines"]];
export const TRADES_PAGE = 6;

export type TradeRow =
  | { kind: "own"; family: "manual"; id: string; position: OwnPosition }
  | { kind: "group"; family: StrategyTrade["family"]; id: string; trades: StrategyTrade[] };

const uniq = <T>(xs: readonly T[]) => [...new Set(xs)];

/** Your trades, then one row per (stock, family), in the order the block lists them. */
export function tradeRows(own: readonly OwnPosition[], trades: readonly StrategyTrade[]): TradeRow[] {
  const groups = new Map<string, Extract<TradeRow, { kind: "group" }>>();
  for (const t of trades) {
    const key = `${t.id}|${t.family}`;
    const g = groups.get(key) ?? { kind: "group" as const, family: t.family, id: t.id, trades: [] };
    g.trades.push(t);
    groups.set(key, g);
  }
  return [...own.map((position) => ({ kind: "own" as const, family: "manual" as const, id: position.id, position })), ...groups.values()];
}

export const rowsOf = (rows: readonly TradeRow[], tab: Tab) => rows.filter((r) => tab === "all" || r.family === tab);

/** A group's figures, each one a trade's own value: strategies, horizons, exit dates, and the profit or loss of one
 *  trade (`pnl` when all are equal, else `low` and `high`). */
export function groupFigures(trades: readonly StrategyTrade[]) {
  const pnl = uniq(trades.map((t) => t.unrealised));
  return {
    strategies: uniq(trades.map((t) => t.strategy)),
    horizons: uniq(trades.map((t) => t.horizon)),
    exits: uniq(trades.map((t) => t.exit)).sort(),
    amount: trades[0].amount,
    pnl: pnl.length === 1 ? pnl[0] : null,
    low: Math.min(...pnl),
    high: Math.max(...pnl),
    /** The one trade's return in percent, shown only for a single trade. */
    pct: trades.length === 1 ? (trades[0].unrealised / trades[0].amount) * 100 : null,
  };
}

/** A position's return on its cost, percent. */
export const ownPct = (p: OwnPosition) => (p.unrealised / (p.avg * Math.abs(p.qty))) * 100;
