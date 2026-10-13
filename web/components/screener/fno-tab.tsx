"use client";
// The Screener's F&O tab (story W12; 33 notes rows 9 to 11; India only, absent in the US): the four futures build-ups
// as tiles, the other F&O screens as chips, every count a field of the F&O summary block; then the rows (fno-table.tsx).
import type { FnoScreenerRows, FnoScreenerSummary } from "../../lib/screener/contract.ts";
import { BUILDUPS, FNO_SCREENS, fnoSortOf, type FnoScreen } from "../../lib/screener/screens.ts";
import type { ScreenerState } from "../../lib/screener/state.ts";
import { dateShort } from "../../lib/shell/clock.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { useFrame } from "../frame/frame-context.tsx";
import { Num } from "../ui/figures.tsx";
import { Icon } from "../ui/icon.tsx";
import { ScreenChip, useScreenerNav } from "./controls.tsx";
import { FnoTable } from "./fno-table.tsx";

const SORT_WORDS: Record<string, string> = { oi: "futures open interest (₹)", fc: "futures change", "-fc": "futures fall", oc: "open interest change", "-oc": "open interest fall", ivr: "IV against its 3-month range", "-ivr": "lowest IV against its range", pcr: "put-call ratio", "-pcr": "lowest put-call ratio", mv: "move priced in" };
const sum = (path: string) => sourceName("fnoSummary", path);

export function FnoLook({ state, summary }: { state: ScreenerState; summary: FnoScreenerSummary }) {
  const to = useScreenerNav(state);
  const toggle = (k: FnoScreen) => to({ fpre: state.fpre === k ? "" : k, page: 1, fsort: "" });
  return (
    <>
      <div className="mb-scr-look" role="region" aria-label="Futures build-up today">
        {BUILDUPS.map(([k, label, tone, icon, sub]) => (
          <button key={k} className="mb-scr-tile" type="button" aria-pressed={state.fpre === k} onClick={() => toggle(k)}>
            <span className="k"><span className={`mb-label ${tone}`}><Icon name={icon} />{label}</span></span>
            <b><Num value={summary.buildups[k]} src={sum(`buildups.${k}`)} decimals={0} locale="en-IN" /></b>
            <small>{sub}</small>
          </button>
        ))}
      </div>
      <div className="mb-scr-presets" role="group" aria-label="Ready-made screens">
        <span className="lbl">Ready-made screens</span>
        {FNO_SCREENS.map(([k, label, tip, , path]) => (
          <ScreenChip key={k} label={label} tip={tip} on={state.fpre === k} toggle={() => toggle(k)}>
            <Num value={summary.screens[k as keyof FnoScreenerSummary["screens"]]} src={sum(path)} decimals={0} locale="en-IN" />
          </ScreenChip>
        ))}
      </div>
    </>
  );
}

export function FnoResults({ state, summary, rows }: { state: ScreenerState; summary: FnoScreenerSummary; rows: FnoScreenerRows }) {
  const to = useScreenerNav(state);
  const { shell } = useFrame();
  const key = state.fsort || fnoSortOf(state.fpre);
  const def = [...BUILDUPS.map((b) => [b[0], b[4]] as const), ...FNO_SCREENS.map((f) => [f[0], f[2]] as const)].find(([k]) => k === state.fpre);
  return (
    <>
      <p className="count">
        <b><Num value={rows.total} src={sourceName("fnoRows", "total")} decimals={0} locale="en-IN" /> underlyings</b>
        {def ? `· ${def[1]}` : ""}
        {`· nearest monthly expiry (${dateShort(`${summary.expiry}T10:00:00Z`, shell)}) · sorted by ${SORT_WORDS[key] ?? key}`}
        {state.fpre ? <button className="md-btn text small" type="button" onClick={() => to({ fpre: "", fsort: "", page: 1 })}>Show all</button> : null}
      </p>
      <FnoTable state={state} rows={rows} sortKey={key} />
    </>
  );
}
