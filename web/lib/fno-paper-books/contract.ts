// The paper books' read model (story W3c; contract FnoPaperTrades, api/schemas/fno-paper-trades.yaml, P1 and 2.8.0):
// what the page `paper_trades` of exepex/trading's F&O publication carries. Each book's own account, the shadow tests
// apart, open positions and closed trades; what was done, never the rules that did it (the contract's x-never-sent).
// Types only.
import type { FnoFamily } from "../fno-forecast-lab/contract.ts";

export interface Brake {
  loss_from_high: number;
  pause_at: number;
}

export interface BookAccount {
  family: FnoFamily;
  as_of: string;
  opening_value: number;
  value: number;
  cash: number;
  open_trades: number;
  open_max_loss: number;
  /** The book's published open-risk cap (C5's config, contract 2.9). */
  open_risk_cap: number;
  brake: Brake;
}

export interface ShadowAccount {
  name: string;
  label: "shadow" | "measurement";
  as_of: string;
  opening_value: number;
  value: number;
  open_trades: number;
}

/** One option leg: owner only (the dashboard is behind sign-in; the public gateway never reaches this screen). */
export interface Leg {
  contract: string;
  side: "buy" | "sell";
  lots: number;
  option_type: "CE" | "PE";
  strike: number;
  expiry: string;
}

export interface MonitorAlert {
  at: string;
  text: string;
}

export interface OpenPosition {
  trade_id: string;
  family: FnoFamily;
  strategy: string;
  structure: string;
  legs: Leg[];
  opened_on: string;
  max_loss: number;
  mark_value: number;
  unrealised: number;
  days_to_expiry: number;
  monitor: "alert_only" | "intraday_exits" | null;
  alerts_today: number | null;
  alerts: MonitorAlert[];
}

export type FillOutcome = "filled" | "missed_price_moved" | "missed_no_quote";
export type ExitKind = "take_profit" | "time_exit" | "max_loss_exit" | "expiry_settlement" | "safety_stop" | "other";

export interface OwnerFill {
  minutes: 5 | 30 | 60;
  outcome: FillOutcome;
  net: number | null;
}

export interface ClosedTrade {
  trade_id: string;
  family: FnoFamily;
  strategy: string;
  structure: string;
  opened_on: string;
  closed_on: string;
  gross: number;
  costs: number;
  net: number;
  result: "won" | "lost" | "flat";
  exit: ExitKind;
  fills: OwnerFill[] | null;
}

export interface FnoPaperTrades {
  accounts: BookAccount[];
  shadows: ShadowAccount[];
  open: OpenPosition[];
  closed: ClosedTrade[];
}
