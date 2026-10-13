// The frame's clock words (story W8; the mockup runtime's formatting, design/mockups/_platform/js/1-core.js): every time
// on the market's own clock from the payload's offset, never the viewer's, and every price with its as-of stamp and
// freshness. Pure.
import { DOW, MONTH } from "../ui/format.ts";
import type { FrameData, Instrument, MarketShell } from "./contract.ts";

const pad = (n: number) => String(n).padStart(2, "0");
/** A UTC instant moved onto the market's clock; read it with the getUTC* methods. */
export const onClock = (iso: string, shell: MarketShell) => new Date(Date.parse(iso) + shell.offset_min * 60000);
const day = (d: Date) => d.toISOString().slice(0, 10);
const hm = (d: Date) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;

/** "09:15 IST". */
export const clockTime = (iso: string, shell: MarketShell) => `${hm(onClock(iso, shell))} ${shell.zone}`;

/** "Thu 8 Oct". */
export function dateShort(iso: string, shell: MarketShell): string {
  const d = onClock(iso, shell);
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH[d.getUTCMonth()]}`;
}

/** "17:30 IST" when on the same market day as `nowIso`, else "Tue 6 Oct, 15:30 IST". */
export function when(iso: string, nowIso: string, shell: MarketShell): string {
  const d = onClock(iso, shell);
  return day(d) === day(onClock(nowIso, shell)) ? clockTime(iso, shell) : `${dateShort(iso, shell)}, ${clockTime(iso, shell)}`;
}

export interface AsOf {
  /** "6 Oct close", "EOD 1 Oct", "3 pm snap", "17:30 IST". */
  short: string;
  stale: boolean;
  tip: string;
}

/** An instrument's as-of stamp: stale when older than its source's own cadence allows. */
export function asOf(item: Instrument, data: Pick<FrameData, "now" | "sources" | "shell">): AsOf {
  const { shell } = data;
  const source = data.sources[item.source];
  const d = onClock(item.as_of, shell);
  const sameDay = day(d) === day(onClock(data.now, shell));
  const stale = (Date.parse(data.now) - Date.parse(item.as_of)) / 3600000 > source.max_age_h;
  const dm = `${d.getUTCDate()} ${MONTH[d.getUTCMonth()]}`;
  const short =
    item.source === "eod" ? `EOD ${dm}` : item.source === "snap3pm" ? (sameDay ? "3 pm snap" : `3 pm ${dm}`) : sameDay ? clockTime(item.as_of, shell) : `${dm} close`;
  const tip =
    `${source.label} (${source.detail}). As of ${when(item.as_of, data.now, shell)}.` +
    (stale ? " Stale: older than this source should be." : "") +
    (item.note ? ` ${item.note}` : "") +
    " Not a live price.";
  return { short, stale, tip };
}
