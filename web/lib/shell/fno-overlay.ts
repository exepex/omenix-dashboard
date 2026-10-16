// The frame's F&O-owned parts from the F&O tool's publication (story W9-F&O; exepex/trading P10): India's index levels,
// its session times and the F&O picks replace the example records' values; every other part (stocks, accounts,
// stock picks, notifications) stays the labelled example. The frame's clock becomes the read time, so the market status
// follows the real session. A part with no data carries its reason instead, never an example value. India only: the US
// slice is never touched. Pure.
import type { HeldView } from "../fno-holds/holds.ts";
import type { Part } from "../ui/block-outcome.ts";
import type { FnoPicks, IndexLevel, Indices, Instrument, MarketShell, Session, ShellPayload } from "./contract.ts";

export interface FnoParts {
  session: Part<Session & { regime?: string }>;
  indices: Part<Indices>;
  picks: Part<FnoPicks>;
  /** The picks' hold (page `today`); absent or null when not held or the holds are unknown. */
  picksHeld?: HeldView | null;
}

const missingOf = (part: Part<unknown>) => ("missing" in part ? part.missing : undefined);

function indexItem(ix: IndexLevel, base: Instrument | undefined): Instrument {
  return {
    id: ix.id, kind: "index", sym: ix.sym, code: base?.code ?? ix.id, name: ix.name, last: ix.last, chg_pct: ix.chg_pct,
    chg_5d_pct: ix.chg_5d_pct, source: ix.source, as_of: ix.as_of, fno: base?.fno ?? ix.role === "benchmark", live: true,
    // The source's label still names the stock tool's close (the contract has no NSE-close source yet): say who published it.
    note: "Published by the F&O tool (NSE's index close).",
  };
}

/** India's slice with its F&O parts from the publication; `fallback` gives the session times when none is published. */
function liveIndia(shell: MarketShell, parts: FnoParts, fallback: Session): MarketShell {
  const items = { ...shell.items };
  for (const id of shell.indices) delete items[id];
  let indices: string[] = [];
  if ("value" in parts.indices) {
    for (const ix of parts.indices.value.indices) items[ix.id] = indexItem(ix, shell.items[ix.id]);
    indices = parts.indices.value.indices.map((ix) => ix.id);
  }
  const session = "value" in parts.session ? parts.session.value : fallback;
  const picks = "value" in parts.picks ? parts.picks.value : null;
  return {
    ...shell,
    items,
    indices,
    status: { session_date: session.session_date, open_utc: session.open_utc, close_utc: session.close_utc, next_open_utc: session.next_open_utc, ...(session.hours_status ? { hours_status: session.hours_status } : {}) },
    fno_state: picks?.fno_state,
    fno_rows: picks?.rows ?? [],
    fno_live: { missing: { session: missingOf(parts.session), indices: missingOf(parts.indices), picks: missingOf(parts.picks) }, ...(parts.picksHeld ? { held: { picks: parts.picksHeld } } : {}) },
  };
}

export function withFnoParts(payload: ShellPayload, parts: FnoParts, now: string, fallback: Session): ShellPayload {
  return { ...payload, now, markets: { ...payload.markets, india: liveIndia(payload.markets.india, parts, fallback) } };
}
