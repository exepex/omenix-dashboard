// The paper trades in words (story W3c; design/mockups/41-paper-books, its 3-trades.js): open positions with their
// legs and today's monitor alerts (owner only: the dashboard is behind sign-in), and closed trades after costs with the
// same decision filled at the owner's three reaction times (one decision, never three trials; the verdict uses 60
// minutes). Every figure is the payload's. Pure.
import { fmtDateYear, fmtLocal } from "../ui/format.ts";
import type { ClosedTrade, ExitKind, FillOutcome, FnoPaperTrades, Leg, OpenPosition } from "./contract.ts";
import { pnlLook, rs, signedRs, type Look } from "./view.ts";

/** India's clock: the payload's times are UTC and India keeps no daylight saving. */
const IST = "+05:30";

export interface OpenRow {
  id: string;
  family: OpenPosition["family"];
  strategy: string;
  structure: string;
  legs: string[];
  opened: string;
  maxLoss: string;
  soFar: Look;
  daysLeft: string;
  alerts: string[];
}

const legOf = (l: Leg) => `${l.side === "buy" ? "Buy" : "Sell"} ${l.lots} × ${l.strike} ${l.option_type}`;

export const openOf = (p: FnoPaperTrades): OpenRow[] =>
  p.open.map((t) => ({
    id: t.trade_id,
    family: t.family,
    strategy: t.strategy,
    structure: t.structure,
    legs: t.legs.map(legOf),
    opened: fmtDateYear(t.opened_on),
    maxLoss: rs(t.max_loss),
    soFar: pnlLook(t.unrealised),
    daysLeft: String(t.days_to_expiry),
    alerts: t.alerts.map((a) => `${fmtLocal(a.at, "india", IST)}: ${a.text}`),
  }));

const RESULT: Record<ClosedTrade["result"], Look> = {
  won: { tone: "success", icon: "check", word: "Won" },
  lost: { tone: "danger", icon: "close", word: "Lost" },
  flat: { tone: "neutral", icon: "trending_flat", word: "Flat" },
};

const EXIT: Record<ExitKind, string> = {
  take_profit: "Took its profit",
  time_exit: "Closed on time",
  max_loss_exit: "Closed at its maximum loss",
  expiry_settlement: "Settled at expiry",
  safety_stop: "Safety stop",
  other: "Other",
};

const FILL: Record<FillOutcome, Look> = {
  filled: { tone: "success", icon: "check", word: "Filled" },
  missed_price_moved: { tone: "warn", icon: "block", word: "Missed: the price moved" },
  missed_no_quote: { tone: "neutral", icon: "remove", word: "Missed: no quote" },
};

export interface FillChip extends Look {
  tip: string;
}

export interface ClosedRow {
  id: string;
  family: ClosedTrade["family"];
  strategy: string;
  exit: string;
  held: string;
  result: Look;
  gross: string;
  costs: string;
  net: string;
  /** null for a trade made before owner-timing fills existed: never filled in after the fact. */
  fills: FillChip[] | null;
}

export const BEFORE_FILLS = "Before owner-timing fills";

export const closedOf = (p: FnoPaperTrades): ClosedRow[] =>
  p.closed.map((t) => ({
    id: t.trade_id,
    family: t.family,
    strategy: t.strategy,
    exit: EXIT[t.exit],
    held: `${fmtDateYear(t.opened_on)} to ${fmtDateYear(t.closed_on)}`,
    result: RESULT[t.result],
    gross: signedRs(t.gross),
    costs: rs(t.costs),
    net: signedRs(t.net),
    fills: t.fills?.map((f) => ({ ...FILL[f.outcome], word: `${f.minutes} min: ${f.net === null ? FILL[f.outcome].word : signedRs(f.net)}`, tip: `${f.minutes} minutes after the card: ${FILL[f.outcome].word}` })) ?? null,
  }));

export const NO_OPEN = "No open position.";
export const NO_CLOSED = "No closed trade yet.";
