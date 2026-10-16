// Today's card's top in words (story W3f; design/mockups/39-trade-card, its 1-base.js and 2-top.js): the verdict
// (TRADE, NO TRADE, WATCH) with its glyph, word and reason, the TEST note, and the card's three times in their order
// with the delivery. Every figure is the payload's. Pure.
import { fmtDate, fmtLocal } from "../ui/format.ts";
import type { CardStatus, CardTiming, FnoCard } from "./contract.ts";

export type Tone = "success" | "warn" | "danger" | "neutral" | "info";
export interface Look {
  tone: Tone;
  icon: string;
  word: string;
}

/** India's clock: the payload's times are UTC and India keeps no daylight saving. */
const IST = "+05:30";

/** "15:15 IST", or "not sent" for a time that does not exist yet. */
export const ist = (iso: string | null) => (iso ? fmtLocal(iso, "india", IST) : "not sent");

/** "Mon 16 Nov 2026". */
export const dayLabel = (iso: string) => `${fmtDate(iso)} ${iso.slice(0, 4)}`;

/** The book's name in words (the badge on screen carries its glyph). */
export const BOOK: Record<"rule" | "hybrid" | "ai", string> = { rule: "Rule-based (Book 1)", hybrid: "Hybrid (Book 2)", ai: "AI team (Book 3)" };

const STATUS: Record<CardStatus, { verdict: string; icon: string; sub: string }> = {
  TRADE: { verdict: "yes-ok", icon: "check", sub: "A paper trade today" },
  "NO TRADE": { verdict: "no", icon: "block", sub: "Nothing to do today" },
  WATCH: { verdict: "watch", icon: "science", sub: "For learning only: never traded" },
};

export interface Header {
  status: CardStatus;
  verdict: string;
  icon: string;
  detail: string;
  why: string;
  label: string;
  test: string | null;
}

export const TEST_NOTE = "TEST post: a one-off check of live delivery, not the day’s card.";

export function headerOf(c: FnoCard): Header {
  const s = STATUS[c.status];
  return { status: c.status, verdict: s.verdict, icon: s.icon, detail: `${s.sub} · ${dayLabel(c.session)} · ${c.session_note} · valid until ${ist(c.valid_until)}`, why: c.reason_text, label: c.label, test: c.test_post ? TEST_NOTE : null };
}

export interface TimeFact {
  k: string;
  v: string;
  note: string;
}

const DELIVERY: Record<CardTiming["delivery"], Look> = {
  sent: { tone: "success", icon: "check", word: "Sent" },
  retrying: { tone: "danger", icon: "close", word: "Retrying" },
  not_sent: { tone: "danger", icon: "close", word: "Alert NOT sent" },
};

/** The three times in their order (market data frozen, decision final, card sent), then the delivery. */
export function timesOf(c: FnoCard): { times: TimeFact[]; delivery: Look } {
  const t = c.timing;
  return {
    times: [
      { k: "1. Market data frozen", v: ist(t.market_data_cutoff), note: "No later price enters the card" },
      { k: "2. Decision final", v: ist(t.decision_finalized_at), note: "Checks and objections on the same data" },
      { k: "3. Card sent", v: ist(t.card_sent_at), note: "Slack’s own time stamp" },
    ],
    delivery: DELIVERY[t.delivery],
  };
}
