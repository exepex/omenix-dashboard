"use client";
// The Screener's stocks, at a glance (story W12; 33 notes rows 3 and 4): up and down today with the breadth bar, the
// three tiles (near 52-week high and low, volume 3× usual) and the ready-made screens' chips with their counts. Every
// count is the summary block's field for the chosen universe; the two tools-based chips count the followed companies,
// as the contract defines (notes row 4).
import type { ScreenerSummary, ScreenerTools, UniverseCounts } from "../../lib/screener/contract.ts";
import { screenCount, screenDef, screensOf, type ScreenDef } from "../../lib/screener/screens.ts";
import type { ScreenerState } from "../../lib/screener/state.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { Num } from "../ui/figures.tsx";
import { ScreenChip, useScreenerNav } from "./controls.tsx";

const field = (state: ScreenerState, path: string) => sourceName("summary", `universes.${state.uni}.${path}`);

function Count({ def, state, counts, tools, locale }: { def: ScreenDef; state: ScreenerState; counts: UniverseCounts; tools: ScreenerTools | null; locale: string }) {
  const { n, path } = screenCount(def, state.uni, counts, tools);
  if (n === null) return <span className="muted" data-tip="The stock tool’s records are not published here yet.">—</span>;
  return path ? <Num value={n} src={sourceName("summary", path)} decimals={0} locale={locale} /> : <span data-derived="tools">{n.toLocaleString(locale)}</span>;
}

function Breadth({ state, c, locale }: { state: ScreenerState; c: UniverseCounts; locale: string }) {
  const n = (k: keyof UniverseCounts) => <Num value={c[k] as number} src={field(state, k)} decimals={0} locale={locale} />;
  return (
    <div className="mb-scr-tile breadth">
      <span className="k">Today: up and down</span>
      <b>{n("up")} up · {n("down")} down</b>
      <span className="mb-breadth" role="img" aria-label={`${c.up} up, ${c.down} down, ${c.flat} unchanged`}>
        <i className="up" style={{ flex: c.up }} />
        <i className="flat" style={{ flex: c.flat }} />
        <i className="down" style={{ flex: c.down }} />
      </span>
      <small>{n("flat")} unchanged · of {n("n")}</small>
    </div>
  );
}

export function StocksLook({ state, summary, tools, india, locale }: { state: ScreenerState; summary: ScreenerSummary; tools: ScreenerTools | null; india: boolean; locale: string }) {
  const to = useScreenerNav(state);
  const counts = summary.universes[state.uni];
  if (!counts) return null;
  const toggle = (key: ScreenDef["key"]) => to({ pre: state.pre === key ? "" : key, page: 1, sort: "" });
  return (
    <>
      <div className="mb-scr-look" role="region" aria-label="Today in one look">
        <Breadth state={state} c={counts} locale={locale} />
        {(["high", "low", "volume"] as const).map((k) => {
          const def = screenDef(k)!;
          return (
            <button key={k} className="mb-scr-tile" type="button" aria-pressed={state.pre === k} onClick={() => toggle(k)}>
              <span className="k">{def.label}</span>
              <b><Count def={def} state={state} counts={counts} tools={tools} locale={locale} /></b>
              <small>{def.tip}</small>
            </button>
          );
        })}
      </div>
      <div className="mb-scr-presets" role="group" aria-label="Ready-made screens">
        <span className="lbl">Ready-made screens</span>
        {screensOf(india).map((def) => (
          <ScreenChip key={def.key} label={def.label} tip={def.tip} on={state.pre === def.key} toggle={() => toggle(def.key)}>
            <Count def={def} state={state} counts={counts} tools={tools} locale={locale} />
          </ScreenChip>
        ))}
      </div>
    </>
  );
}
