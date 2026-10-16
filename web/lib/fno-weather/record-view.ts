// The weather's record in words (story W3a; design/mockups/40-weather, its 3-record.js): the last sessions against
// what happened, how often it is RED against its frozen 15% maximum, its score against the two yardsticks and this
// month's price of the RED rule. Every figure is the payload's. Pure.
import { DASH, fmtDate, money, pct } from "../ui/format.ts";
import type { FnoWeather, WeatherScore } from "./contract.ts";
import { colourLabel, type Tone } from "./view.ts";

export interface SessionCell {
  day: string;
  label: ReturnType<typeof colourLabel>;
  outcome: string;
}

export const recentOf = (w: FnoWeather): SessionCell[] =>
  w.recent.map((r) => ({ day: fmtDate(r.session, false), label: colourLabel(r.colour), outcome: r.big_move === null ? "not known yet" : r.big_move ? "2% move" : "no big move" }));

export interface RedShareView {
  tone: Tone;
  icon: string;
  state: string;
  /** The bar's width as a share of twice the maximum, so the maximum sits at the middle. */
  bar: number;
  aria: string;
  words: string;
}

export function redShareOf(w: FnoWeather): RedShareView {
  const r = w.red_share;
  const [tone, icon, state]: [Tone, string, string] = !r.sessions ? ["neutral", "remove", "No sessions yet"] : r.over_alarming ? ["danger", "warning", "Over-alarming"] : ["success", "check", "Within the limit"];
  const words = r.sessions
    ? `RED on ${r.red_sessions} of the last ${r.sessions} sessions (${pct(r.share, 1)}); the limit is ${pct(r.max_share)}. Above it, a new version must be proposed; RED still blocks until you approve it.`
    : "No session counted yet.";
  return { tone, icon, state, bar: Math.min(100, Math.round(((r.share ?? 0) / (2 * r.max_share)) * 1000) / 10), aria: `${pct(r.share, 1)} of sessions RED; the limit is ${pct(r.max_share)}`, words };
}

const VERDICT: Record<WeatherScore["verdict"], [Tone, string, string]> = {
  better: ["success", "check", "Better"],
  worse: ["danger", "close", "Worse"],
  no_difference: ["neutral", "trending_flat", "No clear difference"],
  not_tested: ["neutral", "timer", "Not enough data yet"],
};

export interface ScoreRow {
  question: string;
  against: string;
  days: string;
  needs: string;
  brier: string;
  brierBaseline: string;
  verdict: { tone: Tone; icon: string; word: string };
}

const brier = (x: number | null) => (x === null ? DASH : x.toFixed(3));

export const scoresOf = (w: FnoWeather): ScoreRow[] =>
  w.scores.map((s) => {
    const [tone, icon, word] = VERDICT[s.verdict];
    return {
      question: s.question === "V6_1d" ? "Next session" : "Within 5 sessions",
      against: s.baseline === "base_rate" ? "The usual chance" : "The old checklist (v0)",
      days: String(s.n_scored),
      needs: `test needs ${s.n_needed}`,
      brier: brier(s.brier),
      brierBaseline: brier(s.brier_baseline),
      verdict: { tone, icon, word },
    };
  });

export type PriceView = { kind: "measured"; facts: { label: string; value: string; note?: string }[] } | { kind: "words"; text: string };

/** This month's price of the RED rule, on paper; "not measured yet" until shadow fills exist, never a guess. */
export function priceOf(w: FnoWeather): PriceView {
  const p = w.price_of_calm;
  if (p.status !== "measured") return { kind: "words", text: p.status === "nothing_blocked" ? "Nothing was blocked this month." : "Not measured yet: the blocked trades’ shadow results come later." };
  const net = p.shadow_net ?? 0;
  return {
    kind: "measured",
    facts: [
      { label: "Trades blocked", value: String(p.blocked_trades ?? 0) },
      { label: "Risk avoided", value: money("INR", p.risk_avoided), note: "Their maximum losses" },
      { label: !net ? "RED made no difference" : net > 0 ? "RED cost" : "RED saved", value: money("INR", Math.abs(net)), note: "What the blocked trades would have made, on paper" },
    ],
  };
}
