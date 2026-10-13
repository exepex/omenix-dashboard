// The app frame's read-model contract (story W8): the fields of the signed-off mockup design/mockups/30-shell, whose
// notes.md is the frozen data contract (signed off by the owner on 13 Oct 2026). Units: prices in the instrument's
// currency, changes in percent, money in INR (India) or USD (US), never converted or summed; times are UTC ISO strings.
// Types only: no data, no client. Every adapter (the fixture today, the backends' read models later) returns these.
import type { Market } from "../data/constants.ts";

export type InstrumentKind = "stock" | "index" | "future" | "option";
/** close: the stock tool's daily close; eod: NSE's end-of-day F&O file; snap3pm: the F&O tool's 3 pm option quotes. */
export type PriceSource = "close" | "eod" | "snap3pm";
export type Family = "rule" | "hybrid" | "ai" | "baseline" | "manual";
export type PickRule = "best_expected_gain" | "highest_probability";

export interface Holding {
  account: string;
  qty: number;
  avg: number;
  structure?: string;
}

export interface Instrument {
  id: string;
  kind: InstrumentKind;
  sym: string;
  /** The exchange trading symbol, e.g. NIFTY26OCT22800CE. */
  code: string;
  name: string;
  last: number | null;
  chg_pct: number | null;
  chg_5d_pct?: number | null;
  source: PriceSource;
  as_of: string;
  state?: "active" | "inactive";
  /** The last 30 daily closes (stocks). */
  spark?: number[] | null;
  /** The instrument has F&O contracts (India only). */
  fno?: boolean;
  held?: Holding;
  bid?: number | null;
  ask?: number | null;
  /** Implied volatility in percent, computed by the F&O tool from the snapshot. */
  iv?: number | null;
  underlying?: string;
  lot?: number;
  /** Why the value is an example (labelled). */
  example?: string;
  note?: string;
  /** Read from a backend's publication (W9-F&O), not the example records: never labelled "Example data". */
  live?: boolean;
}

export interface SourceRule {
  label: string;
  detail: string;
  /** Older than this many hours is stale (greyed, says "stale"). */
  max_age_h: number;
}

export interface FamilyInfo {
  label: string;
  icon: string;
  long: string;
}

export interface Session {
  session_date: string;
  open_utc: string;
  close_utc: string;
  next_open_utc: string;
  /** Mockup only: a time during the session, for the labelled "example clock" state. */
  example_open_now?: string;
}

export interface Agreement {
  buy: number;
  of: number;
  by_family: Record<"rule" | "ai" | "baseline", { buy: number; of: number }>;
}

export interface PickRecord {
  trades: number;
  win_rate: number;
  net_pnl: number;
  badge: string;
}

/** One strategy family's buy pick of today (stock tool rm.head_to_head). */
export interface Signal {
  id: string;
  family: Family;
  strategy_id: string;
  /** Display name; never an AI model name. */
  strategy: string;
  pick_rules: PickRule[];
  horizon: number;
  /** 0-1. */
  prob_up: number;
  move_pct: number;
  loss_pct: number;
  costs_pct: number;
  /** Expected gain after market costs, percent. */
  exp_gain_pct: number;
  amount: number;
  agree: Agreement;
  record: PickRecord | null;
}

export interface Account {
  name: string;
  /** Strategy books are listed but never traded by hand. */
  kind: "manual" | "strategy";
  approach: Family;
  currency: string;
  capital?: number;
  cash?: number;
  open_structures?: number;
  at_risk?: number;
  capital_note?: string;
}

export interface Limits {
  max_loss_per_trade: number | null;
  max_open_structures: number | null;
  max_at_risk: number | null;
}

export interface IndiaRates {
  brokerage_flat: number;
  exchange_pct: number;
  sebi_pct: number;
  gst_pct: number;
  stamp_buy_pct: number;
  stt_pct?: number;
  stt_sell_pct?: number;
}

export interface UsRates {
  commission_flat: number;
  sec_sell_pct: number;
  taf_per_share_sell?: number;
}

export interface Charges {
  label: string;
  equity_delivery?: IndiaRates;
  option?: IndiaRates;
  equity?: UsRates;
}

export interface SearchExtra {
  kind: "strategy" | "news" | "screen";
  label: string;
  sub: string;
}

export interface Notification {
  icon: string;
  title: string;
  sub: string;
  unread: boolean;
}

export interface GoLive {
  proven: boolean;
  months_forward: number;
  trades_needed: number;
}

export interface FnoState {
  approved: boolean;
  note: string;
}

/** One F&O book's idea for today (W10 FnoPickRow; India only): a basket of legs with its risk. */
export interface FnoPickRow {
  basket: string;
  family: "rule" | "hybrid" | "ai";
  strategy: string;
  name: string;
  /** Risk-neutral probability of profit, percent. */
  pop: number;
  max_loss: number;
  credit?: number;
  debit?: number;
}

/** W10 FnoPicks (page "today"): the F&O tool's 3 pm state for the picks panel. */
export interface FnoPicks {
  currency: "INR";
  fno_state: FnoState;
  rows: FnoPickRow[];
  baskets: Record<string, unknown>;
}

/** W10 IndexLevel and Indices (page "indices"): the benchmark and volatility index at their last close. */
export interface IndexLevel {
  id: string;
  sym: string;
  name: string;
  role: "benchmark" | "vol_index";
  last: number;
  chg_pct: number;
  chg_5d_pct: number;
  as_of: string;
  source: PriceSource;
}

export interface Indices {
  indices: IndexLevel[];
}

/** Which of a market's frame parts come from the F&O tool's publication (W9-F&O), and why one is missing. */
export interface FnoLive {
  /** A part with no data: its reason (empty, or the read failed), shown where the part would be. */
  missing: Partial<Record<"session" | "indices" | "picks", string>>;
}

export interface MarketShell {
  label: string;
  exchange: string;
  currency: string;
  zone: string;
  /** Minutes east of UTC of the market's clock. */
  offset_min: number;
  /** True only for India: there is no US F&O. */
  fno: boolean;
  indices: string[];
  items: Record<string, Instrument>;
  status: Session;
  accounts: Record<string, Account>;
  signals: Signal[];
  no_pick: string[];
  family_text: Record<Family, string>;
  example_note: string;
  go_live: GoLive;
  recent: string[];
  search_extra: SearchExtra[];
  limits: Limits;
  charges: Charges;
  short_option_margin_per_lot?: number;
  next_quotes: { stock: string; option?: string };
  fno_state?: FnoState;
  /** Today's F&O ideas (W9-F&O; empty until a book's strategy is approved). */
  fno_rows?: FnoPickRow[];
  /** Present when the F&O parts (indices, session, F&O picks) are read from the F&O tool: the rest stays example. */
  fno_live?: FnoLive;
}

/** The whole frame payload, both markets. */
export interface ShellPayload {
  /** The instant the payload describes (the fixture's clock; a live adapter's read time). */
  now: string;
  /** True when the payload is example data (labelled "Example data" on screen). */
  example: boolean;
  sources: Record<PriceSource, SourceRule>;
  families: Record<Family, FamilyInfo>;
  pick_rules: Record<PickRule, string>;
  limits_note: string;
  markets: Record<Market, MarketShell>;
  notifications: Record<Market, Notification[]>;
}

/** What the frame of one market renders: that market's slice plus the market labels for the switch. */
export interface FrameData {
  market: Market;
  now: string;
  example: boolean;
  sources: ShellPayload["sources"];
  families: ShellPayload["families"];
  pick_rules: ShellPayload["pick_rules"];
  limits_note: string;
  marketLabels: Record<Market, string>;
  shell: MarketShell;
  notifications: Notification[];
}
