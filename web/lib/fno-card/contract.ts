// Today's card's read model (story W3f; contract FnoCard, api/schemas/fno-card.yaml, P1, T1's addendum and 2.11.0): what the
// page `card` of exepex/trading's F&O publication carries. PAPER ONLY; what the desk decided and why in plain words,
// never the strategy's rules, prompts or parameters (the contract's x-never-sent). The position, the stress line and
// the objections are owner only (the dashboard is behind sign-in). Types only.
import type { FnoFamily } from "../fno-forecast-lab/contract.ts";
import type { Leg } from "../fno-paper-books/contract.ts";
import type { MissingInput, WeatherColour } from "../fno-weather/contract.ts";

export type CardStatus = "TRADE" | "NO TRADE" | "WATCH";
export type NoTradeReason = "no_approved_strategy" | "weather_red" | "data_check_failed" | "risk_bucket_full" | "budget_stop" | "cost_wall" | "advocate_hard_rule";

export interface CardTiming {
  market_data_cutoff: string;
  decision_finalized_at: string;
  card_sent_at: string | null;
  delivery: "sent" | "retrying" | "not_sent";
}

export interface CardTrade {
  family: FnoFamily;
  strategy: string;
  what: string;
  legs: Leg[];
  entry: { kind: "debit" | "credit"; min_per_unit: number; max_per_unit: number; valid_until: string };
  size: { lots: number; units: number; funds_at_entry: number };
  max_loss: number;
  /** The most one paper trade may lose, from the book's C5 profile (contract 2.11.0). */
  max_loss_cap: number;
  worst_cases: { scenario: string; loss: number }[];
  exit_plan: string[];
  costs: { charges_and_pads: number; breakeven_per_unit: number; tax_rate: number };
  vol_edge: { vega_per_lot: number; edge_needed_points: number } | null;
  proves_wrong: string[];
}

export interface TrackRecord {
  status: "scored" | "not_enough_data" | "no_bin" | "no_report";
  scored: number;
  said_from: number | null;
  said_to: number | null;
  days: number | null;
  happened_share: number | null;
  mean_brier: number | null;
}

export interface CardForecast {
  question: string;
  plain: string;
  probability: number | null;
  forecaster: string;
  backfill: TrackRecord;
  live: TrackRecord;
}

export interface StressLine {
  nifty_move_pct: number;
  vix_move_pct: number;
  loss: number;
}

export interface FnoCard {
  label: "PAPER ONLY";
  test_post: boolean;
  session: string;
  session_note: string;
  status: CardStatus;
  reason: NoTradeReason | null;
  reason_text: string;
  timing: CardTiming;
  valid_until: string;
  trade: CardTrade | null;
  stress: { open_positions: number; max_loss_sum: number; scenarios: StressLine[] };
  paper_trades_so_far: { total: number; by_book: { family: FnoFamily; trades: number }[] };
  weather: { colour: WeatherColour | null; why: string };
  forecast: CardForecast | null;
  forecasts_on_record: {
    capture_day: string;
    late_generated_at: string | null;
    report_day: string | null;
    house_forecaster: string;
    other_forecasters: number;
    questions: CardForecast[];
  } | null;
  advocate: { status: "answered" | "advocate_unavailable" | "not_needed"; objections: string[]; verdict: "no_hard_rule_breach" | "hard_rule_breach" | null };
  data_checks: { passed: boolean; missing_inputs: MissingInput[] };
  missing: string[];
  previous_misses: string[];
  evidence: { rung: number | null; label: "strong evidence" | "some evidence" | "reasoning only" | null; text: string; real_money_eligible: false };
  price_of_staying_out: { status: "not_measured_yet" | "measured" | "nothing_skipped"; shadow_net: number | null } | null;
  if_you_cannot_act: string;
  footer: { record_hashes: { path: string; sha256: string }[] };
}
