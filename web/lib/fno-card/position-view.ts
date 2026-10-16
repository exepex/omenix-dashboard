// The card's position in words (story W3f; design/mockups/39-trade-card, its 3-position.js), TRADE and WATCH only and
// owner only: what, the legs, the entry range, how much, the most it can lose, the worst stretches, the exits, what
// would prove it wrong, costs and tax and the volatility edge. The per-trade loss cap is not in the payload (contract
// 2.10.0), so the screen shows the most it can lose alone and never a copy of the owner's cap. Pure.
import { money } from "../ui/format.ts";
import type { CardTrade, FnoCard } from "./contract.ts";
import { dayLabel, ist, type Look } from "./view.ts";

const rs = (x: number) => money("INR", x);
const rsUnit = (x: number) => money("INR", x, 2);

export interface LegRow {
  contract: string;
  side: Look;
  type: string;
  strike: string;
  expiry: string;
  lots: string;
}

export interface EntryRange {
  words: string;
  aria: string;
  /** Positions on the drawn scale (low end less a fifth, high end plus a fifth), in percent. */
  okFrom: number;
  okWidth: number;
  stopAt: number;
  keys: [string, string, string];
  validity: string;
}

export interface Position {
  title: string;
  what: string;
  strategy: string;
  legs: LegRow[];
  entry: EntryRange;
  size: { k: string; v: string; note?: string }[];
  maxLoss: string;
  worstCases: string[];
  exits: string[];
  provesWrong: string[];
  costs: { k: string; v: string; note: string }[];
  volEdge: { k: string; v: string; note: string }[] | null;
}

const legOf = (l: CardTrade["legs"][number]): LegRow => ({
  contract: l.contract,
  side: l.side === "buy" ? { tone: "success", icon: "arrow_upward", word: "Buy" } : { tone: "danger", icon: "arrow_downward", word: "Sell" },
  type: l.option_type === "CE" ? "call" : "put",
  strike: l.strike.toLocaleString("en-IN"),
  expiry: dayLabel(l.expiry),
  lots: String(l.lots),
});

const round1 = (x: number) => Math.round(x * 10) / 10;

function entryOf(t: CardTrade): EntryRange {
  const e = t.entry;
  const debit = e.kind === "debit";
  const lo = e.min_per_unit * 0.8;
  const hi = e.max_per_unit * 1.2;
  const at = (x: number) => round1(((x - lo) / (hi - lo)) * 100);
  const limit = debit ? `Do not enter above ${rsUnit(e.max_per_unit)}` : `Do not enter below ${rsUnit(e.min_per_unit)}`;
  return {
    words: `Entry: ${debit ? "pay" : "receive"} ${rsUnit(e.min_per_unit)} to ${rsUnit(e.max_per_unit)} a unit`,
    aria: `Enter between ${rsUnit(e.min_per_unit)} and ${rsUnit(e.max_per_unit)} a unit; ${debit ? "never above the high end" : "never below the low end"}`,
    okFrom: at(e.min_per_unit),
    okWidth: round1(at(e.max_per_unit) - at(e.min_per_unit)),
    stopAt: at(debit ? e.max_per_unit : e.min_per_unit),
    keys: debit ? ["Cheaper", limit, "Dearer"] : ["Less received", limit, "More received"],
    validity: `Prices from the 15:00 bid and ask. The card is valid until ${ist(e.valid_until)}; after that it is stale.`,
  };
}

/** The position, or null on a NO TRADE card (it carries none). */
export function positionOf(c: FnoCard): Position | null {
  const t = c.trade;
  if (!t) return null;
  return {
    title: c.status === "WATCH" ? "The shadow position (never traded)" : "The paper position",
    what: t.what,
    strategy: t.strategy,
    legs: t.legs.map(legOf),
    entry: entryOf(t),
    size: [
      { k: "Size", v: `${t.size.lots} lot${t.size.lots === 1 ? "" : "s"} (${t.size.units} units)` },
      { k: "Money tied up", v: rs(t.size.funds_at_entry), note: "The debit plus the short leg’s margin" },
      { k: "Paper", v: "No real money" },
    ],
    maxLoss: `The most it can lose: ${rs(t.max_loss)}, charges included. Fixed at entry: no stop-loss order is needed.`,
    worstCases: t.worst_cases.map((w) => `${w.scenario}: loss ${rs(w.loss)}`),
    exits: t.exit_plan,
    provesWrong: t.proves_wrong,
    costs: [
      { k: "Charges and pads", v: rs(t.costs.charges_and_pads), note: "A round trip, with worse fills assumed" },
      { k: "Breaks even at", v: `${rsUnit(t.costs.breakeven_per_unit)} a unit`, note: "After costs" },
      { k: "Tax scenario", v: `${(t.costs.tax_rate * 100).toFixed(1)}%`, note: "On the year’s net F&O profit" },
    ],
    volEdge: t.vol_edge
      ? [
          { k: "Vega per lot", v: rs(t.vol_edge.vega_per_lot), note: "Per point of implied volatility" },
          { k: "Edge needed", v: `${t.vol_edge.edge_needed_points} points`, note: "Of implied volatility, to cover costs" },
        ]
      : null,
  };
}

export const NO_POSITION = "No position today: a NO TRADE card carries none. The reason is at the top; the price of staying out is below.";
