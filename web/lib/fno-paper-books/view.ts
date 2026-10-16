// The paper books in words (story W3c; design/mockups/41-paper-books, its 2-books.js): one card per book, its own
// account and never added to another; the shadow tests apart. Every figure is the payload's; the screen sums nothing
// across books; the open-risk cap is the payload's own (contract 2.9), never a copy in the screen. Pure.
import { fmtDateYear, money } from "../ui/format.ts";
import type { BookAccount, FnoPaperTrades, ShadowAccount } from "./contract.ts";

export type Tone = "success" | "warn" | "danger" | "neutral";
export interface Look {
  tone: Tone;
  icon: string;
  word: string;
}

export const rs = (x: number | null) => money("INR", x);
export const signedRs = (x: number | null) => money("INR", x, 0, true);

/** A profit or loss always with its sign, glyph and word, never colour alone. */
export const pnlLook = (x: number): Look =>
  x > 0 ? { tone: "success", icon: "trending_up", word: `Up ${signedRs(x)}` } : x < 0 ? { tone: "danger", icon: "trending_down", word: `Down ${signedRs(x)}` } : { tone: "neutral", icon: "trending_flat", word: `Flat ${signedRs(x)}` };

/** A bar's width in percent of the track, never past its end. */
const width = (part: number, whole: number) => Math.min(100, Math.round((part / whole) * 1000) / 10);

export interface BookCard {
  family: BookAccount["family"];
  value: string;
  marks: string;
  change: Look;
  opening: string;
  cash: string;
  open: string;
  openRisk: { bar: number; aria: string; words: string };
  brake: { bar: number; aria: string; words: string };
}

export function bookOf(a: BookAccount): BookCard {
  const below = rs(a.brake.loss_from_high);
  const pause = rs(a.brake.pause_at);
  return {
    family: a.family,
    value: rs(a.value),
    marks: `at the marks of ${fmtDateYear(a.as_of)}`,
    change: pnlLook(a.value - a.opening_value),
    opening: ` since its opening ${rs(a.opening_value)}`,
    cash: rs(a.cash),
    open: String(a.open_trades),
    openRisk: {
      bar: width(a.open_max_loss, a.open_risk_cap),
      aria: `Open risk ${rs(a.open_max_loss)} of the ${rs(a.open_risk_cap)} cap`,
      words: `Open risk ${rs(a.open_max_loss)} of its ${rs(a.open_risk_cap)} cap (the open positions' maximum losses)`,
    },
    brake: { bar: width(a.brake.loss_from_high, a.brake.pause_at), aria: `${below} below its high; it pauses at ${pause}`, words: `${below} below its high; it pauses new trades at ${pause}` },
  };
}

export const booksOf = (p: FnoPaperTrades): BookCard[] => p.accounts.map(bookOf);

export interface ShadowCard {
  kind: string;
  name: string;
  detail: string;
}

const shadowOf = (s: ShadowAccount): ShadowCard => ({
  kind: s.label === "measurement" ? "Measurement" : "Shadow",
  name: s.name,
  detail: `${rs(s.value)} · ${s.open_trades} open · since ${rs(s.opening_value)}`,
});

export const shadowsOf = (p: FnoPaperTrades): ShadowCard[] => p.shadows.map(shadowOf);

export const NO_SHADOWS = "No shadow test running.";
