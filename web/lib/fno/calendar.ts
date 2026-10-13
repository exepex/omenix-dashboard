// NSE's trading sessions for the F&O freshness rule (story W2): only the exceptions to "every weekday is a regular
// session": weekday holidays, weekend special sessions and the Diwali muhurat session, from NSE's own circulars. The
// rows of design/mockups/_platform/nse_sessions.csv (the same as exepex/trading's research/data/calendar) for the
// covered years; tests/calendar.test.ts keeps them equal. A day outside those years is unknown, never guessed (the
// freshness is then "unknown"). Gap, reported: once the backend publishes its run status and session, this table goes.
// Pure.

export const EXCEPTIONS: readonly [string, "holiday" | "special" | "muhurat"][] = [
  ["2025-02-01", "special"],
  ["2025-02-26", "holiday"],
  ["2025-03-14", "holiday"],
  ["2025-03-31", "holiday"],
  ["2025-04-10", "holiday"],
  ["2025-04-14", "holiday"],
  ["2025-04-18", "holiday"],
  ["2025-05-01", "holiday"],
  ["2025-08-15", "holiday"],
  ["2025-08-27", "holiday"],
  ["2025-10-02", "holiday"],
  ["2025-10-21", "muhurat"],
  ["2025-10-22", "holiday"],
  ["2025-11-05", "holiday"],
  ["2025-12-25", "holiday"],
  ["2026-01-15", "holiday"],
  ["2026-01-26", "holiday"],
  ["2026-02-01", "special"],
  ["2026-03-03", "holiday"],
  ["2026-03-26", "holiday"],
  ["2026-03-31", "holiday"],
  ["2026-04-03", "holiday"],
  ["2026-04-14", "holiday"],
  ["2026-05-01", "holiday"],
  ["2026-05-28", "holiday"],
  ["2026-06-26", "holiday"],
  ["2026-09-14", "holiday"],
  ["2026-10-02", "holiday"],
  ["2026-10-20", "holiday"],
  ["2026-11-08", "muhurat"],
  ["2026-11-10", "holiday"],
  ["2026-11-24", "holiday"],
  ["2026-12-25", "holiday"],
];
const BY_DAY = new Map(EXCEPTIONS);
const YEARS = new Set(EXCEPTIONS.map(([d]) => d.slice(0, 4)));

export interface SessionCalendar {
  /** True on a trading session; throws CalendarUnknown outside the covered years. */
  isSession(day: string): boolean;
}

export class CalendarUnknown extends Error {
  constructor(day: string) {
    super(`no NSE calendar for ${day}`);
    this.name = "CalendarUnknown";
  }
}

const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();

export const nseCalendar: SessionCalendar = {
  isSession(day) {
    if (!YEARS.has(day.slice(0, 4))) throw new CalendarUnknown(day);
    const kind = BY_DAY.get(day);
    if (kind) return kind !== "holiday";
    return weekday(day) !== 0 && weekday(day) !== 6;
  },
};

/** The day before, as YYYY-MM-DD. */
export const dayBefore = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);

/** The last session strictly before `day`. */
export function sessionBefore(day: string, calendar: SessionCalendar): string {
  let d = dayBefore(day);
  while (!calendar.isSession(d)) d = dayBefore(d);
  return d;
}
