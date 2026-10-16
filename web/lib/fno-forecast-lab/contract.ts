// The Forecast lab's read model (story W3b; contract FnoForecastLab, api/schemas/fno-forecast-lab.yaml, P1): what the
// page `forecast_lab` of exepex/trading's F&O publication carries. What each forecaster said and how it scored, never
// how it forecasts (the contract's x-never-sent). Types only.
import type { MissingInput } from "../fno-weather/contract.ts";

export type FnoFamily = "rule" | "hybrid" | "ai";
export type ProtocolVersion = "v3" | "v4";

export interface Protocol {
  version: ProtocolVersion;
  status: "frozen" | "draft";
  frozen_commit: string | null;
  questions: string[];
}

export interface Coverage {
  pack_days: number;
  counted_days: number;
  missing_days: number;
  late_days: number;
  unscored_days: number;
}

export interface Forecaster {
  id: string;
  name: string;
  kind: "family" | "baseline" | "weather" | "house";
  family: FnoFamily | null;
  status: "running" | "not_running" | "not_started";
  isolation: "code" | "sealed_same_day" | "full_f1";
  isolation_label: string | null;
  coverage: Coverage | null;
}

export type AnswerStatus = "counted" | "pending" | "late" | "breach" | "model_mismatch";

export interface Answer {
  forecaster: string;
  probability: number | null;
  variance: number | null;
  status: AnswerStatus;
}

export interface Today {
  made_on: string;
  /** null while the answer day falls in a year whose NSE session calendar is not published yet (contract 2.13.0). */
  answer_on: string | null;
  values: Answer[];
}

export interface ForecasterScore {
  forecaster: string;
  n: number;
  n_missing: number;
  mean_loss: number | null;
}

export type Verdict = "better" | "worse" | "no_difference" | "futile" | "not_tested" | "before_review";

export interface Comparison {
  forecaster: string;
  baseline: string;
  n_pairs: number;
  mean_diff: number | null;
  interval: [number, number] | null;
  p_value: number | null;
  verdict: Verdict;
  min_effect_met: boolean | null;
  futility_upper_bound: number | null;
}

export interface Settle {
  status: "not_measured" | "projected" | "beyond_2_years";
  r: number | null;
  projected_date: string | null;
}

export interface Question {
  id: string;
  protocol: ProtocolVersion;
  plain: string;
  kind: "probability" | "variance";
  horizon_sessions: number;
  metric: "brier" | "qlike";
  primary_baseline: string;
  status: "scoring" | "waiting_for_data" | "not_started";
  waiting_for: MissingInput[];
  today: Today | null;
  scores: { n_scored: number; n_void: number; n_needed: number; per_forecaster: ForecasterScore[]; comparisons: Comparison[] };
  settle: Settle;
}

export interface FnoForecastLab {
  standing: string;
  protocols: Protocol[];
  forecasters: Forecaster[];
  questions: Question[];
}
