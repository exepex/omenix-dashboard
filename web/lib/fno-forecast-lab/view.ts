// The Forecast lab's overview in words (story W3b; design/mockups/37-forecasts at f04cb50, its 2-today, 3-best and
// 5-forecasters scripts): today's answers with when each is known, which forecaster beats the yardstick on which
// question, and who forecasts, how each is kept from the answers and how many days counted. Every figure is the
// payload's; no rank is made across questions (their miss scores are on different scales). Pure.
import { DASH, fmtDate } from "../ui/format.ts";
import type { Answer, AnswerStatus, FnoForecastLab, Forecaster, Question } from "./contract.ts";

export type Tone = "success" | "warn" | "danger" | "neutral";
export interface Look {
  tone: Tone;
  icon: string;
  word: string;
}

/** A forecaster's display name: the payload's own, or its id when the payload does not name it. */
export const nameOf = (lab: FnoForecastLab, id: string) => lab.forecasters.find((f) => f.id === id)?.name ?? id;

/** "7 Oct 2026". */
export const dayYear = (iso: string) => `${fmtDate(iso, false)} ${iso.slice(0, 4)}`;

const STATUS_NOTE: Record<AnswerStatus, string> = { counted: "", pending: " (pending)", late: " (late, not counted)", breach: " (audit breach, not counted)", model_mismatch: " (wrong model, not counted)" };

/** An answer as the question asks it: a chance in whole percent, or a variance to 4 decimals. */
export function answerOf(q: Question, a: Answer): string {
  const value = q.kind === "probability" ? (a.probability === null ? DASH : `${Math.round(a.probability * 100)}%`) : a.variance === null ? DASH : a.variance.toFixed(4);
  return value + STATUS_NOTE[a.status];
}

/** Said when the answer day falls in a year whose NSE trading days are not published yet (contract 2.13.0). */
export const ANSWER_DAY_UNKNOWN = "Not known yet: NSE has not published that year’s trading days";

export interface TodayRow {
  question: string;
  answers: string;
  knownOn: string;
}

export const todayOf = (lab: FnoForecastLab): TodayRow[] =>
  lab.questions.flatMap((q) => (q.today ? [{ question: q.plain, answers: q.today.values.map((a) => `${nameOf(lab, a.forecaster)} ${answerOf(q, a)}`).join(" · "), knownOn: q.today.answer_on ? dayYear(q.today.answer_on) : ANSWER_DAY_UNKNOWN }] : []));

export interface BestRow {
  question: string;
  best: Look;
  worse: string | null;
  yardstick: string;
}

/** Who beats the question's yardstick, from the backend's own verdicts only. */
export function bestOf(lab: FnoForecastLab): BestRow[] {
  return lab.questions.map((q) => {
    const names = (verdict: string) => q.scores.comparisons.filter((c) => c.verdict === verdict).map((c) => nameOf(lab, c.forecaster));
    const better = names("better");
    const worse = names("worse");
    const best: Look = !q.scores.comparisons.length ? { tone: "neutral", icon: "timer", word: "Not tested yet" } : better.length ? { tone: "success", icon: "check", word: `Better: ${better.join(", ")}` } : { tone: "neutral", icon: "trending_flat", word: "Nobody better yet" };
    return { question: q.plain, best, worse: worse.length ? `Worse: ${worse.join(", ")}` : null, yardstick: nameOf(lab, q.primary_baseline) };
  });
}

const STATE: Record<Forecaster["status"], Look> = {
  running: { tone: "success", icon: "check", word: "Running" },
  not_running: { tone: "neutral", icon: "timer", word: "Not running" },
  not_started: { tone: "neutral", icon: "remove", word: "Not started" },
};

/** What each forecaster is. A baseline is only "Baseline": the three differ (option prices, the past base rate, a
 *  simple model; exepex/trading research/forecasts/PROTOCOL.md) and each one's own name says which. Which forecaster
 *  is a question's yardstick is the payload's `primary_baseline` (under protocol v3 a book, Rule-based), never assumed
 *  from its kind. */
const KIND: Record<Forecaster["kind"], string> = { family: "Book", baseline: "Baseline", weather: "Weather", house: "The card’s forecast" };

export interface ForecasterRow {
  id: string;
  name: string;
  family: Forecaster["family"];
  what: string;
  state: Look;
  keptBy: string;
  counted: string;
  detail: string | null;
}

/** Who forecasts: an AI book's isolation label is always shown as sent ("sealed same day (not full F1)"). */
export const forecastersOf = (lab: FnoForecastLab): ForecasterRow[] =>
  lab.forecasters.map((f) => ({
    id: f.id,
    name: f.name,
    family: f.family,
    what: KIND[f.kind],
    state: STATE[f.status],
    keptBy: f.isolation === "code" ? "Plain code" : (f.isolation_label ?? "Full isolation"),
    counted: f.coverage ? `${f.coverage.counted_days} of ${f.coverage.pack_days}` : DASH,
    detail: f.coverage ? `${f.coverage.missing_days} missing · ${f.coverage.late_days} late · ${f.coverage.unscored_days} not scored` : null,
  }));

/** The protocols' chips: a draft counts nothing yet. */
export const protocolsOf = (lab: FnoForecastLab) =>
  lab.protocols.map((p) => ({ label: `Protocol ${p.version}: ${p.status === "frozen" ? "frozen" : "draft (nothing counts yet)"}`, tip: p.questions.join(", ") }));
