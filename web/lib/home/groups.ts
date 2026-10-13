// "Who trades, and how it is going" (story W9; 31 notes.md row 4): one card each for You, Rule-based, Hybrid and AI
// team. A card's headline is the group's own total from the Groups block (the owner's one allowed sum, formed by the
// publisher); in India the group's F&O book is its own line, never added in. Groups, markets and currencies are never
// added together, and nothing here adds anything: every figure is a block field passed through. Pure.
import type { FnoBook, GroupTotal, StockFamily, StockGroup, StrategyResult } from "./contract.ts";

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export interface GroupCard {
  family: StockFamily;
  /** The headline: the group's total, or null with the empty state. */
  total: GroupTotal | null;
  totalLabel: string;
  totalSub: string;
  /** The group's F&O book (India), its own line. */
  book: FnoBook | null;
  bookSub: string;
  /** Strategies with at least one settled trade (each with its own net), and how many more have none. */
  ran: StrategyResult[];
  idle: number;
  /** The collapsed list's summary, or the plain count line when there is no list. */
  countLine: string;
  hasList: boolean;
}

/** One card per stock group, with its F&O book when the market has F&O (`books` is null in the US). */
export function groupCard(group: StockGroup, books: readonly FnoBook[] | null): GroupCard {
  const T = group.total;
  const book = books?.find((b) => b.family === group.family) ?? null;
  const ran = group.strategies.filter((s) => s.trades > 0);
  const totalSub = !T
    ? "planned"
    : group.family === "ai"
      ? `the team’s own trades · ${plural(T.trades, "trade", "trades")} settled, ${T.wins} won`
      : `${plural(T.with_trades, "strategy", "strategies")} with trades added up · ${plural(T.trades, "trade", "trades")} settled, ${T.wins} won`;
  return {
    family: group.family,
    total: T,
    totalLabel: books ? "Stocks: total profit / loss" : "Total profit / loss",
    totalSub,
    book,
    bookSub: book ? `${book.name} · ${book.approved.length ? plural(book.approved.length, "approved strategy", "approved strategies") : "no approved strategy yet"}` : "",
    ran,
    idle: group.strategies.length - ran.length,
    countLine:
      group.family === "ai"
        ? "One team: its strategies show once it publishes them"
        : group.strategies.length
          ? `${plural(group.strategies.length, "strategy", "strategies")} · ${ran.length} with trades`
          : "No strategy yet",
    hasList: group.strategies.length > 0,
  };
}
