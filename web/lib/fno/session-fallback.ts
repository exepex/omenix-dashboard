// NSE's session times from the session calendar (story W9-F&O), for the frame's market status while the F&O tool's
// session block is not published: regular hours (09:15 to 15:30 IST) on every session day. Special and muhurat
// sessions keep other hours, which only the published block can give; the frame says the times are the calendar's.
// Pure.
import { sessionAfter, sessionBefore, type SessionCalendar } from "./calendar.ts";
import type { Session } from "../shell/contract.ts";

const IST_OFFSET_MS = 330 * 60000;
const at = (day: string, utc: string) => `${day}T${utc}:00Z`;

/** Today's session in India (or the last one, on a closed day), and the next open, at regular hours. */
export function calendarSession(now: Date, calendar: SessionCalendar): Session {
  const today = new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
  const day = calendar.isSession(today) ? today : sessionBefore(today, calendar);
  return { session_date: day, open_utc: at(day, "03:45"), close_utc: at(day, "10:00"), next_open_utc: at(sessionAfter(today, calendar), "03:45") };
}
