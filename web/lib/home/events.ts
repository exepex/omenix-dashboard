// "Coming up" from two publishers (story W9-F&O): the stock tool's events and, in India, the F&O tool's expiry dates.
// F&O expiries belong to the F&O tool, so the stock list's own expiry rows give way to them (never shown twice); the
// rest merge by date, each row keeping where it came from, so the page can label the example rows. Pure.
import type { CalendarEvent, Events } from "./contract.ts";

const EXPIRY = "fno_expiry";

export interface ComingRow {
  event: CalendarEvent;
  /** True for a row read from a backend's publication; false for the labelled example records. */
  live: boolean;
}

/** The F&O expiry rows of an events block (the fixture's F&O part). */
export const fnoExpiries = (events: Events): Events => ({ events: events.events.filter((e) => e.kind === EXPIRY) });

/** One date-ordered list: the stock rows (without expiries when the F&O list is there) and the F&O rows. */
export function comingUp(stock: Events, stockLive: boolean, fno: Events | null, fnoLive: boolean): ComingRow[] {
  const stockRows = (fno ? stock.events.filter((e) => e.kind !== EXPIRY) : stock.events).map((event) => ({ event, live: stockLive }));
  const fnoRows = (fno?.events ?? []).map((event) => ({ event, live: fnoLive }));
  return [...stockRows, ...fnoRows].sort((a, b) => (a.event.date < b.event.date ? -1 : a.event.date > b.event.date ? 1 : 0));
}
