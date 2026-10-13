// The Markets overview's own blocks (story W12), as W11's contract types them (api/schemas/blocks-overview.yaml;
// signed-off 34-markets/notes.md). Breadth and movers are the Screener's blocks (lib/screener/contract.ts); "What is
// coming?" is Home's events block (lib/home/contract.ts); the header's reading is the frame's session block.
import type { PeriodChange } from "../screener/contract.ts";

/** One index, fund or instrument at its own last close, with its changes and daily closes (oldest first). */
export interface OverviewQuote {
  id?: string;
  name: string;
  kind: "broad" | "vol" | "sector" | "benchmark" | "vol_index" | "sector_etf" | "cue" | "factor" | "fx";
  close: number;
  as_of: string;
  d1: PeriodChange;
  w1: PeriodChange;
  m1: PeriodChange;
  m3: PeriodChange;
  y1: PeriodChange;
  hi52: number | null;
  lo52: number | null;
  pe?: number | null;
  pb?: number | null;
  dy?: number | null;
  closes: (number | null)[];
  sectors?: string[] | null;
}

/** The broad indices and the volatility index. */
export interface OverviewIndices {
  indices: OverviewQuote[];
}

export interface Industry {
  g: string;
  n: number;
  d1: PeriodChange;
  w1: PeriodChange;
  m1: PeriodChange;
  m3: PeriodChange;
  y1: PeriodChange;
  up: number;
  down: number;
  best: [string, number];
  worst: [string, number];
}

/** India: NSE's sector indices and the Nifty 500 by industry. */
export interface IndiaSectors {
  indices: OverviewQuote[];
  industries: Industry[];
}

/** US: the stock tool's sector funds. */
export interface UsSectors {
  funds: OverviewQuote[];
}

export interface FlowTotal {
  days_in_period: number;
  days: number;
  complete: boolean;
  fii: number | null;
  dii: number | null;
}

export interface FlowSide {
  buy: number;
  sell: number;
  net: number;
  provisional: boolean;
}

/** India: FII/FPI and DII per day, published period totals (null unless complete) and NSDL's FPI net. */
export interface Flows {
  currency: string;
  totals: Record<"d1" | "w1" | "m1" | "m3" | "y1", FlowTotal>;
  days: { date: string; fii: FlowSide; dii: FlowSide }[];
  nsdl: { date: string; net: number }[];
}

/** US: Treasury par yields by maturity. */
export interface Rates {
  yields: { name: string; value: number; date: string }[];
}

/** World markets, currencies and commodities. */
export interface World {
  quotes: OverviewQuote[];
}
