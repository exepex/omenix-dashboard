// A screen's "Coming up" from two publishers (contract 2.5, owner 14 Oct 2026): the stock tool's calendar and, in
// India, exepex/trading's NSE F&O expiries (getFnoEvents). The screen merges the two and applies its own query to the
// merged list, the same query each publisher's block answers (api/paths/blocks-home.yaml getEvents x-shared), so the
// list is exactly the one calendar's view: the contract's check_home_events proves it on the signed-off Home. Each row
// keeps where it came from, so a screen can label the example rows. Pure.
import type { CalendarEvent, Events } from "./contract.ts";

/** GET /events's query (tools/api/examples_screens.py `view`): kinds from a date, nearest first, up to a limit;
 *  market_first: the market-wide rows first, then each company's next row. */
export interface EventsQuery {
  kinds: readonly string[];
  limit: number;
  market_first?: boolean;
  /** market_first only: the companies whose next row counts (the route's filter; the screen's merge needs none). */
  tickers?: readonly string[];
}

/** Home's query (31 row 6) and the Markets overview's (34 row 12). */
export const HOME_EVENTS: EventsQuery = { kinds: ["rbi_policy", "earnings", "holiday", "fno_expiry", "fomc", "cpi", "jobs_report"], limit: 6, market_first: true };
export const MARKETS_EVENTS: EventsQuery = { kinds: ["earnings", "ex_dividend", "fno_expiry", "weekly_expiry", "filing", "rbi_policy", "fomc", "cpi", "jobs_report", "budget"], limit: 12 };

export interface ComingRow {
  event: CalendarEvent;
  /** True for a row read from a backend's publication; false for the labelled example records. */
  live: boolean;
}

const calendarOrder = (a: ComingRow, b: ComingRow) => {
  const ka = [a.event.date, a.event.inst !== null ? 1 : 0, a.event.title] as const;
  const kb = [b.event.date, b.event.inst !== null ? 1 : 0, b.event.title] as const;
  return ka[0] < kb[0] ? -1 : ka[0] > kb[0] ? 1 : ka[1] - kb[1] || (ka[2] < kb[2] ? -1 : ka[2] > kb[2] ? 1 : 0);
};

/** The query over calendar rows (in calendar order), from `from`. */
export function eventsView(rows: ComingRow[], query: EventsQuery, from: string): ComingRow[] {
  const kept = [...rows].sort(calendarOrder).filter((r) => r.event.date >= from && query.kinds.includes(r.event.kind));
  if (!query.market_first) return kept.slice(0, query.limit);
  const market = kept.filter((r) => r.event.inst === null).slice(0, query.limit);
  const seen = new Set<string>();
  const counts = (inst: string) => !query.tickers || query.tickers.includes(inst);
  const companies = kept.filter((r) => r.event.inst !== null && counts(r.event.inst) && !seen.has(r.event.inst) && seen.add(r.event.inst));
  return [...market, ...companies.slice(0, query.limit - market.length)].sort(calendarOrder);
}

/** One screen's list: the stock rows and the F&O rows (null in the US) merged, the screen's query applied again. */
export function comingUp(stock: Events, stockLive: boolean, fno: Events | null, fnoLive: boolean, query: EventsQuery, from: string): ComingRow[] {
  const rows = [...stock.events.map((event) => ({ event, live: stockLive })), ...(fno?.events ?? []).map((event) => ({ event, live: fnoLive }))];
  return eventsView(rows, query, from);
}

/** The calendar day at a market's clock (minutes east of UTC): the query's start when no session block is there. */
export const dayAt = (now: Date, offsetMin: number) => new Date(now.getTime() + offsetMin * 60000).toISOString().slice(0, 10);
