// F&O freshness (story W2; the contract's BlockFreshness, rule fno_calendar): by NSE's session calendar and the daily
// run, never by a fixed age. P6's run publishes the last session before the day at 07:10 IST (its cron); it is due by
// 08:30 IST (GitHub often starts late). So:
//   fresh       the current publication is the latest session a run should have published by now;
//   publishing  between 07:10 and 08:30 IST, the run for the newest session may be in progress: the previous complete
//               publication is shown, marked "publishing";
//   stale       the publication is older than it should be: the reason names the missing session and when it was due;
//   unknown     the day is outside the calendar's years.
// Gap, reported: fno.run_status does not exist yet, so "publishing" is the run's window, not its reported state, and a
// failed run's own reason cannot be shown. Pure.
import { CalendarUnknown, dayBefore, sessionBefore, type SessionCalendar } from "./calendar.ts";

export interface BlockFreshness {
  state: "fresh" | "stale" | "publishing" | "unknown";
  rule: "fno_calendar";
  built_at: string | null;
  age_minutes: number | null;
  reason: string | null;
}

/** A product's current publication and its freshness: a page's one runtime state line. */
export interface PublicationState {
  publication_id: string;
  as_of: string;
  freshness: BlockFreshness;
}

const IST_OFFSET_MIN = 330;
export const RUN_STARTS_MIN = 7 * 60 + 10; // 07:10 IST
export const RUN_DUE_MIN = 8 * 60 + 30; // 08:30 IST

/** The IST calendar day and minute of the day of an instant. */
function ist(now: Date): { day: string; minute: number } {
  const t = new Date(now.getTime() + IST_OFFSET_MIN * 60000);
  return { day: t.toISOString().slice(0, 10), minute: t.getUTCHours() * 60 + t.getUTCMinutes() };
}

const ageMinutes = (builtAt: string | null, now: Date) => (builtAt ? Math.max(0, Math.floor((now.getTime() - Date.parse(builtAt)) / 60000)) : null);

/** The freshness of a publication of session `asOf`, built at `builtAt`, seen at `now`. */
export function fnoFreshness(asOf: string, builtAt: string | null, now: Date, calendar: SessionCalendar): BlockFreshness {
  const base = { rule: "fno_calendar" as const, built_at: builtAt, age_minutes: ageMinutes(builtAt, now) };
  try {
    const { day, minute } = ist(now);
    const newest = sessionBefore(day, calendar); // what today's run publishes
    const previous = sessionBefore(dayBefore(day), calendar); // what yesterday's run published
    if (asOf >= newest) return { ...base, state: "fresh", reason: null };
    if (minute < RUN_STARTS_MIN) {
      return asOf >= previous ? { ...base, state: "fresh", reason: null } : stale(base, previous, asOf);
    }
    if (minute < RUN_DUE_MIN && asOf >= previous) {
      return { ...base, state: "publishing", reason: `The daily update with the NSE close of ${newest} is due by 08:30 IST; until then this shows ${asOf}, the last complete update.` };
    }
    return stale(base, newest, asOf);
  } catch (e) {
    if (e instanceof CalendarUnknown) return { ...base, state: "unknown", reason: e.message };
    throw e;
  }
}

function stale(base: Omit<BlockFreshness, "state" | "reason">, missing: string, asOf: string): BlockFreshness {
  return { ...base, state: "stale", reason: `The NSE close of ${missing} should have arrived by 08:30 IST and has not; this shows ${asOf}, the last complete update.` };
}
