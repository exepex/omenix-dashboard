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

export const PREVIOUS_CARD = "Previous session’s card";

/** The verdict line: a held-back day's card is the previous session's, so it never says "today" in the screen's own
 *  words, and its own reason is dated by its session (owner, 16 Oct 2026; contract 2.12.0). */
export function headerOf(c: FnoCard): Header {
  const s = STATUS[c.status];
  const sub = c.withheld ? PREVIOUS_CARD : s.sub;
  const why = c.withheld ? `On ${dayLabel(c.session)}: ${c.reason_text}` : c.reason_text;
  return { status: c.status, verdict: s.verdict, icon: s.icon, detail: `${sub} · ${dayLabel(c.session)} · ${c.session_note} · valid until ${ist(c.valid_until)}`, why, label: c.label, test: c.test_post ? TEST_NOTE : null };
}

export interface HeldBack {
  reason: string;
  rest: string;
  /** False when the card on record is not from an earlier session than the held-back one: a contract error, so the
   *  card is not shown at all (it could only be read as today's). */
  showCard: boolean;
}

/** Today's card held back: the owner's sentence, and the card below dated as the previous session's; null on a normal
 *  day. ISO dates compare as text. */
export function heldBackOf(c: FnoCard): HeldBack | null {
  const w = c.withheld;
  if (!w) return null;
  const earlier = c.session < w.session;
  return {
    reason: w.reason_text,
    rest: earlier ? ` (${dayLabel(w.session)}). Below is the card of ${dayLabel(c.session)}, not today’s.` : ` (${dayLabel(w.session)}). The card on record is not from an earlier session, so it is not shown.`,
    showCard: earlier,
  };
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
