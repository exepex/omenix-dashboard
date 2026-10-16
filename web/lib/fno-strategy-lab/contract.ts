// The Strategy lab's F&O read model (story W3d; contract FnoStrategyLab, api/schemas/fno-strategy-lab.yaml, P1): what
// the page `strategy_lab` of exepex/trading's F&O publication carries. What each idea is and how far it got, never its
// rules (the contract's x-never-sent). Types only.
import type { FnoFamily } from "../fno-forecast-lab/contract.ts";

export type IdeaStatus = "idea" | "screened_out" | "exploratory_shadow" | "registered" | "testing" | "passed" | "failed" | "retired";

export interface Idea {
  trial: number;
  title: string;
  rests_on: string | null;
  gate: "G0" | "G1" | "G2" | "G3" | "G4" | "G5" | "G6";
  status: IdeaStatus;
  verdict: "pass" | "fail" | null;
  label: "strong evidence" | "some evidence" | "reasoning only";
}

export interface Book {
  family: FnoFamily;
  approved: string[];
  trading: boolean;
  why_not: string | null;
  ai_and_data_costs: number | null;
}

export interface StrategyResult {
  strategy: string;
  family: FnoFamily;
  rung: number;
  status: "active" | "paused" | "retired";
  pause_reason: string | null;
  trades: number;
  won: number;
  lost: number;
  gross: number;
  costs: number;
  net: number;
  net_after_tax: number;
  net_per_risk: { value: number | null; lower_bound: number | null };
  fill_error_per_unit: number | null;
  worst_trade: number | null;
  max_drawdown: number;
  vs_index_fund: number | null;
  vs_cash: number | null;
}

export interface FnoStrategyLab {
  headline: { any_passed: boolean; text: string };
  factory: { trials_total: number; by_status: Record<IdeaStatus, number>; expected_false_passes: number; pass_level: number };
  ideas: Idea[];
  books: Book[];
  results: StrategyResult[];
  real_money: { eligible: false; checks: { id: number; plain: string; met: boolean | null }[] };
}
