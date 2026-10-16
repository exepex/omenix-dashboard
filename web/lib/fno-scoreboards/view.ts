// The F&O scoreboards in words (story W3h; design/mockups/42-scoreboards, its 2-boards.js): scoreboard B (whole
// systems) and A (matched decisions), each its own card and table, one row per book, never added together and never one
// "winner" across the two. Every figure is the payload's. Pure.
import { DASH, fmtDateYear } from "../ui/format.ts";
import { pnlLook, rs, signedRs, type Look } from "../fno-paper-books/view.ts";
import type { BoardBook, FnoScoreboard, FnoScoreboards } from "./contract.ts";

const STATUS: Record<FnoScoreboard["status"], Look> = {
  ok: { tone: "success", icon: "check", word: "Ran" },
  pilot: { tone: "warn", icon: "science", word: "Pilot: no verdict" },
  not_run: { tone: "neutral", icon: "remove", word: "Not run yet" },
};

const BEATS: Record<NonNullable<BoardBook["beats_do_nothing"]>, Look> = {
  yes: { tone: "success", icon: "check", word: "Yes" },
  no: { tone: "danger", icon: "close", word: "No" },
  not_tested: { tone: "neutral", icon: "timer", word: "Not enough trades yet" },
};

export interface BookRow {
  family: BoardBook["family"];
  trades: string;
  net: Look;
  worstMonth: string;
  largestFall: string;
  /** null in a pilot: no verdict at all. */
  beats: Look | null;
}

export interface BoardView {
  title: string;
  what: string;
  status: Look;
  ran: boolean;
  standing: string;
  rows: BookRow[];
  doNothing: Look | null;
}

export const NOT_RUN = "No run yet: this board fills in once the books have closed trades.";
export const NO_VERDICT = "No verdict in a pilot";

const rowOf = (b: BoardBook): BookRow => ({
  family: b.family,
  trades: String(b.trades),
  net: pnlLook(b.net),
  worstMonth: b.worst_month === null ? DASH : signedRs(b.worst_month),
  largestFall: rs(b.max_drawdown),
  beats: b.beats_do_nothing === null ? null : BEATS[b.beats_do_nothing],
});

function boardOf(title: string, what: string, b: FnoScoreboard): BoardView {
  return {
    title,
    what,
    status: STATUS[b.status],
    ran: b.status !== "not_run",
    standing: b.label + (b.as_of ? ` · as of ${fmtDateYear(b.as_of)}` : ""),
    rows: b.books.map(rowOf),
    doNothing: b.do_nothing_net === null ? null : pnlLook(b.do_nothing_net),
  };
}

/** Scoreboard B first, then A: two questions, two cards. */
export const boardsOf = (p: FnoScoreboards): BoardView[] => [
  boardOf("Scoreboard B: whole systems", "Each book’s whole paper account: which complete system made the most money after every cost.", p.board_b),
  boardOf("Scoreboard A: matched decisions", "Every book’s decisions on the same opportunities on a standard shadow account: whose judgement is better.", p.board_a),
];
