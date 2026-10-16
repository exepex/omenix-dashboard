// One question of the Forecast lab in words (story W3b; design/mockups/37-forecasts at f04cb50, 4-questions.js): its
// state, why it waits, the forecasters ranked by their average miss score within this question only (unscored last),
// each comparison's verdict against the yardstick, the test's numbers folded away, and when it could settle. Every
// figure and verdict is the backend's. Pure.
import { DASH } from "../ui/format.ts";
import type { FnoForecastLab, ForecasterScore, Question, Settle, Verdict } from "./contract.ts";
import { dayYear, nameOf, type Look } from "./view.ts";

const QSTATE: Record<Question["status"], Look> = {
  scoring: { tone: "success", icon: "check", word: "Scoring" },
  waiting_for_data: { tone: "warn", icon: "schedule", word: "Waiting for data" },
  not_started: { tone: "neutral", icon: "remove", word: "Not started" },
};

export const VERDICT: Record<Verdict, Look> = {
  better: { tone: "success", icon: "check", word: "Better than the yardstick" },
  worse: { tone: "danger", icon: "close", word: "Worse than the yardstick" },
  no_difference: { tone: "neutral", icon: "trending_flat", word: "No clear difference" },
  futile: { tone: "neutral", icon: "block", word: "Cannot win: stop testing" },
  not_tested: { tone: "neutral", icon: "timer", word: "Not enough days yet" },
  before_review: { tone: "neutral", icon: "event", word: "Before its review date" },
};

const num = (x: number | null, d: number) => (x === null ? DASH : x.toFixed(d));

export function settleWords(s: Settle): string {
  if (s.status === "not_measured") return "Too few days to say when it could settle (under 60).";
  if (s.status === "projected") return `Could settle around ${s.projected_date ? dayYear(s.projected_date) : DASH}.`;
  return `Would need until ${s.projected_date ? dayYear(s.projected_date) : "more than 2 years"}: too long to wait.`;
}

/** Best first by average miss score; a forecaster with no score yet comes last and has no rank. */
export function ranked(rows: ForecasterScore[]): ForecasterScore[] {
  return [...rows].sort((a, b) => Number(a.mean_loss === null) - Number(b.mean_loss === null) || (a.mean_loss ?? 0) - (b.mean_loss ?? 0));
}

export interface RankRow {
  rank: string;
  name: string;
  days: string;
  missing: string;
  miss: string;
}

export interface QuestionCard {
  title: string;
  state: Look;
  meta: string;
  waiting: string[];
  missHead: string;
  rows: RankRow[];
  verdicts: { look: Look; text: string }[];
  numbers: string[];
  provisional: boolean;
  settle: string | null;
  yardstick: string;
}

export function questionOf(lab: FnoForecastLab, q: Question): QuestionCard {
  const s = q.scores;
  const hasScores = q.status === "scoring";
  return {
    title: q.plain,
    state: QSTATE[q.status],
    meta: `${q.id} · protocol ${q.protocol} · answer in ${q.horizon_sessions} session${q.horizon_sessions === 1 ? "" : "s"}`,
    waiting: q.waiting_for.map((m) => `${m.input} (${m.story}): ${m.detail}`),
    missHead: `Average miss (${q.metric === "brier" ? "Brier" : "QLIKE"}, lower is better)`,
    rows: ranked(s.per_forecaster).map((p, i) => ({ rank: p.mean_loss === null ? DASH : String(i + 1), name: nameOf(lab, p.forecaster), days: String(p.n), missing: String(p.n_missing), miss: num(p.mean_loss, 3) })),
    verdicts: s.comparisons.map((c) => ({ look: VERDICT[c.verdict], text: `${nameOf(lab, c.forecaster)} against ${nameOf(lab, c.baseline)}, ${c.n_pairs} days compared` })),
    numbers: s.comparisons.map((c) => `${nameOf(lab, c.forecaster)}: average difference ${num(c.mean_diff, 4)} (below zero favours it), likely range ${c.interval ? c.interval.map((x) => x.toFixed(4)).join(" to ") : DASH}, p-value ${num(c.p_value, 3)}`),
    provisional: q.protocol === "v4",
    settle: hasScores ? settleWords(q.settle) : null,
    yardstick: nameOf(lab, q.primary_baseline),
  };
}

export const questionsOf = (lab: FnoForecastLab): QuestionCard[] => lab.questions.map((q) => questionOf(lab, q));
