// The frame's adapter with the F&O tool's parts (story W9-F&O; exepex/trading P10): the example records for everything
// the stock tool and the dashboard own, India's index levels, session and F&O picks from the F&O publication
// (lib/shell/fno-overlay.ts). Each F&O part is read on its own; one with no data carries its reason, the frame still
// draws; a held picks page carries its notice (judge 256). Without a published session the status uses NSE's calendar at regular hours, said as such.
import type { FnoBlockReader } from "../fno/blocks.ts";
import { FNO_PAGES, type FnoPageKey } from "../fno/pages.ts";
import { CalendarUnknown, type SessionCalendar } from "../fno/calendar.ts";
import { readPageHolds } from "../fno/page-holds.ts";
import { calendarSession } from "../fno/session-fallback.ts";
import { holdOf } from "../fno-holds/holds.ts";
import { settle } from "../ui/block-outcome.ts";
import type { FnoPicks, Indices, Session, ShellPayload } from "./contract.ts";
import { withFnoParts } from "./fno-overlay.ts";
import type { ShellData } from "./source.ts";

/** The calendar's session, or (outside the calendar's years) the example's times, which the missing reason flags. */
function fallbackSession(now: Date, payload: ShellPayload, calendar: SessionCalendar): Session {
  try {
    return calendarSession(now, calendar);
  } catch (e) {
    if (e instanceof CalendarUnknown) return payload.markets.india.status;
    throw e;
  }
}

export function fnoShellData(reader: FnoBlockReader, examples: ShellData, calendar: SessionCalendar, now: () => Date = () => new Date()): ShellData {
  const payload = async <T>(key: FnoPageKey) => (await reader.page<T>(key)).payload;
  return {
    read: async () => {
      const t = now();
      const [base, session, indices, picks, holds] = await Promise.all([
        examples.read(),
        settle("The session", payload<Session & { regime?: string }>(FNO_PAGES.getSessionIndia)),
        settle("The indices", payload<Indices>(FNO_PAGES.getIndicesIndia)),
        settle("The F&O picks", payload<FnoPicks>(FNO_PAGES.getFnoPicks)),
        settle("The held pages", readPageHolds(reader)),
      ]);
      const missing = "missing" in session ? { missing: `${session.missing} Market hours are NSE’s calendar at regular hours (09:15–15:30 IST).` } : session;
      return withFnoParts(base, { session: missing, indices, picks, picksHeld: "value" in holds ? holdOf(holds.value, FNO_PAGES.getFnoPicks) : null }, t.toISOString(), fallbackSession(t, base, calendar));
    },
  };
}
