// The market status chip and the manual trading lock (owner, 13 Oct 2026; 30-shell notes.md "Market status chip and
// the trading lock"): while the market is closed every manual Buy and Sell is disabled with the reason, by this one
// rule. The strategies keep paper trading on their own. The session times come through the ShellData contract. Pure.
import type { InstrumentKind, MarketShell } from "./contract.ts";
import { clockTime, dateShort } from "./clock.ts";

export interface MarketState {
  open: boolean;
  word: "Open" | "Closed" | "Special session";
  /** "closes 15:30 IST" or "opens Thu 8 Oct 09:15 IST" / "opens today 09:30 ET"; for a session whose hours are not
   *  issued, "on Sun 8 Nov; hours not announced yet". */
  text: string;
  /** Contract 2.6: a session exists but the exchange has not announced its hours, so neither open nor closed is known. */
  pending?: true;
}

/** Open between today's open and close; otherwise closed, with the next open (today's when before it). A session whose
 *  hours are not issued is said as such, never "closed" (contract 2.6). */
export function marketState(shell: MarketShell, nowMs: number): MarketState {
  const { open_utc, close_utc, next_open_utc, hours_status, session_date } = shell.status;
  if (hours_status === "not_issued" || !next_open_utc) {
    return { open: false, word: "Special session", text: `on ${dateShort(`${session_date}T06:00:00Z`, shell)}; hours not announced yet`, pending: true };
  }
  const open = open_utc ? Date.parse(open_utc) : NaN;
  const close = close_utc ? Date.parse(close_utc) : NaN;
  if (close_utc && nowMs >= open && nowMs < close) return { open: true, word: "Open", text: `closes ${clockTime(close_utc, shell)}` };
  const next = open_utc && nowMs < open ? open_utc : next_open_utc;
  return { open: false, word: "Closed", text: `opens ${next === open_utc ? "today" : dateShort(next, shell)} ${clockTime(next, shell)}` };
}

/** The one lock rule: the reason every manual Buy and Sell is disabled, or null while the market is open. */
export function tradeLock(state: MarketState): string | null {
  if (state.open) return null;
  if (state.pending) return `Special session ${state.text}: you can buy and sell once NSE announces the hours and the session opens. The strategies keep paper trading on their own.`;
  return `Market closed: you can buy and sell again when it ${state.text}. The strategies keep paper trading on their own.`;
}

/** The chip's tooltip. */
export function marketTip(shell: MarketShell, state: MarketState, exampleClock: boolean): string {
  return (
    (state.pending ? `${shell.exchange}: special session ${state.text}.` : `${shell.exchange}: ${state.word.toLowerCase()}, ${state.text}.`) +
    (state.open ? " You can buy and sell." : state.pending ? " Your buy and sell wait for the hours and the open; the strategies keep paper trading." : " Your buy and sell are paused until then; the strategies keep paper trading.") +
    (exampleClock ? " (Example clock: during the session.)" : "") +
    (shell.fno_live?.missing.session ? " Times are NSE’s calendar at regular hours: the session block is not published yet." : "")
  );
}

/** The instant the frame is drawn at: the payload's clock, or, for example data only, the labelled "example clock"
 *  during the session (the mockup's #clock=open state). */
export function frameClock(shell: MarketShell, nowIso: string, example: boolean, exampleOpen: boolean): number {
  const during = shell.status.example_open_now;
  return example && exampleOpen && during ? Date.parse(during) : Date.parse(nowIso);
}

export const isFno = (kind: InstrumentKind) => kind === "option" || kind === "future";
/** An index is not an instrument: its futures and options are traded. */
export const tradable = (kind: InstrumentKind) => kind !== "index";
