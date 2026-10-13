// "Who trades, and how it is going" (story W9; 31 notes.md row 4): one card each for You, Rule-based, Hybrid and AI
// team. A card's headline is the group's own total from the Groups block (the owner's one allowed sum, formed by the
// publisher); in India the group's F&O book is its own line, never added in. Groups, markets and currencies are never
// added together, and nothing here adds anything: every figure is a block field passed through. Pure.
import type { FnoBook, GroupTotal, Groups, StockFamily, StrategyResult } from "./contract.ts";
import { src } from "./sources.ts";

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export interface GroupCard {
  family: StockFamily;
  /** The headline: the group's total, or null with the empty state; `totalSrc` names its field. */
  total: GroupTotal | null;
  totalSrc: string;
  totalLabel: string;
  totalSub: string;
  /** The group's F&O book (India), its own line. */
  book: FnoBook | null;
  bookSrc: string | null;
  bookSub: string;
  /** Strategies with at least one settled trade (each with its own net and the field it comes from), and how many
   *  more have none. */
  ran: { result: StrategyResult; src: string }[];
  idle: number;
  /** The collapsed list's summary, or the plain count line when there is no list. */
  countLine: string;
  hasList: boolean;
}

/** One card per stock group, in the block's order. */
export const groupCards = (block: Groups, books: readonly FnoBook[] | null) => block.groups.map((_, at) => groupCard(block, at, books));

/** The card of the group at `at` in the block, with its F&O book when the market has F&O (`books` is null in the
 *  US). Each figure's source is named from the same index the figure is read at, so the two cannot disagree. */
export function groupCard(block: Groups, at: number, books: readonly FnoBook[] | null): GroupCard {
  const group = block.groups[at];
  const field = (path: string) => src("groups", `groups[${at}].${path}`);
  const T = group.total;
  const bookAt = books?.findIndex((b) => b.family === group.family) ?? -1;
  const book = books && bookAt >= 0 ? books[bookAt] : null;
  const ran = group.strategies.flatMap((result, i) => (result.trades > 0 ? [{ result, src: field(`strategies[${i}].net`) }] : []));
  const totalSub = !T
    ? "planned"
    : group.family === "ai"
      ? `the team’s own trades · ${plural(T.trades, "trade", "trades")} settled, ${T.wins} won`
      : `${plural(T.with_trades, "strategy", "strategies")} with trades added up · ${plural(T.trades, "trade", "trades")} settled, ${T.wins} won`;
  return {
    family: group.family,
    total: T,
    totalSrc: field("total.net"),
    totalLabel: books ? "Stocks: total profit / loss" : "Total profit / loss",
    totalSub,
    book,
    bookSrc: book ? src("fnoBooks", `books[${bookAt}].pnl`) : null,
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
