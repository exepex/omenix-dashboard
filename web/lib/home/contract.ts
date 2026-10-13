// Home's read-model contract (story W9): one type per block of W10's API contract (api/schemas/blocks-home.yaml,
// blocks-frame.yaml), which maps the frozen 31-dashboard notes.md field by field. Money is in the market's currency
// (INR or USD, never converted or summed across markets); changes are percent points (1.25 = +1.25 %); times are UTC
// ISO strings. The only sum in any block is the owner's per-group total (GroupTotal, AGENTS.md 13 Oct 2026), formed
// by the publisher: the screen never adds figures itself. Types only.

export type Currency = "INR" | "USD";
export type StockFamily = "rule" | "hybrid" | "ai";

/** A strategy's own result (the collapsed list of a group card). */
export interface StrategyResult {
  id: string;
  name: string;
  trades: number;
  wins: number;
  /** Profit after costs; null with no settled trade. */
  net: number | null;
}

/** The owner's per-group total: the group's own strategies added up (or the AI team's own record). */
export interface GroupTotal {
  net: number;
  trades: number;
  wins: number;
  with_trades: number;
  count: number;
  basis: "strategies_sum" | "team_record";
}

export interface StockGroup {
  family: StockFamily;
  total: GroupTotal | null;
  strategies: StrategyResult[];
  /** Why the group has no strategy yet, or null. */
  empty: string | null;
}

/** GET /api/v1/markets/{market}/groups. */
export interface Groups {
  currency: Currency;
  groups: StockGroup[];
  baselines: { total: GroupTotal; strategies: StrategyResult[] };
}

export interface FnoBook {
  book: 1 | 2 | 3;
  family: StockFamily;
  name: string;
  value: number;
  /** The book's own paper profit or loss: never added to a stock total. */
  pnl: number;
  approved: string[];
  limit_used: number;
  limit_max: number;
  as_of: string;
}

/** GET /api/v1/markets/india/fno/books (India only: the US has no F&O). */
export interface FnoBooks {
  currency: "INR";
  books: FnoBook[];
}

export interface StrategyTrade {
  id: string;
  family: StockFamily | "baseline";
  strategy_id: string;
  strategy: string;
  horizon: number;
  /** Shares; negative = sold short. */
  qty: number;
  avg: number;
  unrealised: number;
  /** Exit date (YYYY-MM-DD). */
  exit: string;
  amount: number;
  as_of: string;
}

/** GET /api/v1/markets/{market}/strategy-trades. */
export interface StrategyTrades {
  currency: Currency;
  strategy_trades: StrategyTrade[];
}

export interface AttentionItem {
  icon: string;
  tone: "info" | "warn" | "primary" | "danger" | "success";
  title: string;
  sub: string;
  inst: string | null;
}

/** GET /api/v1/markets/{market}/attention. */
export interface Attention {
  attention: AttentionItem[];
}

export interface CalendarEvent {
  date: string;
  title: string;
  kind: string;
  major: boolean;
  inst: string | null;
}

/** GET /api/v1/markets/{market}/events. */
export interface Events {
  events: CalendarEvent[];
}

export interface NewsItem {
  title: string;
  src: string;
  status: string;
  at: string;
  tickers: string[];
}

/** GET /api/v1/markets/{market}/top-news. */
export interface TopNews {
  news: NewsItem[];
}

export interface TrackedMove {
  id: string;
  sym: string;
  last: number;
  chg_pct: number;
  as_of: string;
  source: string;
}

/** GET /api/v1/markets/{market}/tracked-moves. */
export interface TrackedMoves {
  companies: TrackedMove[];
}

export interface ManualAccount {
  id: string;
  name: string;
  capital: number;
  cash: number;
  value: number;
  open_profit: number;
  as_of: string;
}

/** GET /api/v1/markets/{market}/accounts (the Manual account is what Home reads). */
export interface Accounts {
  currency: Currency;
  accounts: { manual: ManualAccount };
}

export interface OwnPosition {
  id: string;
  account: string;
  qty: number;
  avg: number;
  last: number;
  unrealised: number;
  as_of: string;
  /** Where the trade was recorded, e.g. "Recorded from Slack". */
  source: string;
}

/** GET /api/v1/markets/{market}/positions. */
export interface Positions {
  currency: Currency;
  own: OwnPosition[];
}

/** GET /api/v1/markets/{market}/session (the part Home's market line reads beyond the frame's chip). */
export interface Session {
  exchange: string;
  zone: string;
  session_date: string;
  open_utc: string;
  close_utc: string;
  next_open_utc: string;
  regime: string;
  post_close_at: string;
}
