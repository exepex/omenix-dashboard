"use client";
// Is the move broad, and which sectors led (story W12; 34 notes rows 5 and 6). Breadth is the Screener's summary block
// (India: all NSE or the Nifty 500; the US: our 20 companies, where the reading sentence is hidden as too few to read).
// Sectors: NSE's sector indices or the Nifty 500 by industry (India), the stock tool's sector funds (US); tiles shaded
// by size, always with sign and number, best first.
import type { IndiaSectors, UsSectors } from "../../lib/overview/contract.ts";
import type { MarketsState } from "../../lib/overview/state.ts";
import { PERIOD_WORDS, tone } from "../../lib/overview/view.ts";
import type { ScreenerSummary, UniverseCounts } from "../../lib/screener/contract.ts";
import { signed } from "../../lib/ui/format.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { Segmented } from "../ui/controls.tsx";
import { Num } from "../ui/figures.tsx";
import { SectionHead } from "../blocks/section-head.tsx";
import { useMarketsNav } from "./nav.tsx";

function reading(b: UniverseCounts): string | null {
  if (b.n < 100) return null;
  if (b.near_low > b.near_high * 2) return "Far more stocks sit near their year’s low than near its high: a weak market underneath.";
  if (b.near_high > b.near_low * 2) return "Far more stocks sit near their year’s high than near its low: a strong market underneath.";
  return "Highs and lows are roughly balanced.";
}

export function Breadth({ summary, state, india, locale }: { summary: ScreenerSummary; state: MarketsState; india: boolean; locale: string }) {
  const to = useMarketsNav(state);
  const uni = india ? state.br : "ours";
  const b = summary.universes[uni];
  if (!b) return null;
  const n = (k: keyof UniverseCounts) => <Num value={b[k] as number} src={sourceName("summary", `universes.${uni}.${k}`)} decimals={0} locale={locale} />;
  const all = summary.universes.all;
  return (
    <section className="card" aria-label="Breadth">
      <SectionHead title="Is the move broad?" sub={india ? "how many stocks rose or fell today" : "our 20 companies only (no whole-market US file)"} />
      {india && all ? <Segmented label="Which stocks" options={[{ value: "all" as const, label: `All NSE (${all.n.toLocaleString(locale)})` }, { value: "n500" as const, label: "Nifty 500" }]} value={state.br} onChange={(br) => to({ br })} light={false} /> : null}
      <div className="big" style={{ marginTop: 12 }}>{n("up")} up · {n("down")} down</div>
      <span className="mb-breadth" role="img" aria-label={`${b.up} up, ${b.flat} unchanged, ${b.down} down`} style={{ margin: "8px 0" }}>
        <i className="up" style={{ flex: b.up }} /><i className="flat" style={{ flex: b.flat }} /><i className="down" style={{ flex: b.down }} />
      </span>
      <div className="val">
        <div className="mb-fact"><span className="k">New 52-week highs</span><b>{n("high")}</b><small>{n("near_high")} within 2%</small></div>
        <div className="mb-fact"><span className="k">New 52-week lows</span><b>{n("low")}</b><small>{n("near_low")} within 2%</small></div>
        <div className="mb-fact"><span className="k">Up over a month</span><b data-derived="up_1m / n">{`${Math.round((b.up_1m / b.n) * 100)}%`}</b><small>{n("up_1m")} of {n("n")} stocks</small></div>
      </div>
      {reading(b) ? <p className="muted small" style={{ margin: "10px 0 0" }}>{reading(b)}</p> : null}
    </section>
  );
}

interface Tile {
  name: string;
  v: number | null;
  src: string;
  sub: string;
  tip: string;
}

function tiles(sectors: IndiaSectors | UsSectors, state: MarketsState, locale: string): Tile[] {
  const f = (x: number | null) => (x === null ? "—" : x.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const one = (x: number | null | undefined) => (x == null ? "" : `P/E ${x.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`);
  if ("funds" in sectors) return sectors.funds.map((q, i) => ({ name: q.name, v: q[state.per], src: sourceName("sectors", `funds[${i}].${state.per}`), sub: q.sectors ? `our ${q.sectors.join(", ")}` : "", tip: `${f(q.close)} · 52-week ${f(q.lo52)}–${f(q.hi52)}` }));
  if (state.sec === "industry") return sectors.industries.map((g, i) => ({ name: g.g, v: g[state.per], src: sourceName("sectors", `industries[${i}].${state.per}`), sub: `${g.n} stocks · ${g.up} up, ${g.down} down`, tip: `Best ${g.best[0]} ${signed(g.best[1])}, worst ${g.worst[0]} ${signed(g.worst[1])} today` }));
  return sectors.indices.map((q, i) => ({ name: q.name, v: q[state.per], src: sourceName("sectors", `indices[${i}].${state.per}`), sub: one(q.pe), tip: `${f(q.close)} · 52-week ${f(q.lo52)}–${f(q.hi52)}` }));
}

export function Sectors({ sectors, state, locale }: { sectors: IndiaSectors | UsSectors; state: MarketsState; locale: string }) {
  const to = useMarketsNav(state);
  const shown = tiles(sectors, state, locale).sort((a, b) => (b.v ?? -1e9) - (a.v ?? -1e9));
  return (
    <section className="card" aria-label="Sectors">
      <SectionHead title="Which sectors led?" sub={`change ${PERIOD_WORDS[state.per]}, best first`} />
      {"funds" in sectors ? (
        <span className="muted small">US sector funds (SPDR and others), as the stock tool records them</span>
      ) : (
        <Segmented label="Sectors" options={[{ value: "index" as const, label: "Sector indices", tip: "NSE’s sector indices" }, { value: "industry" as const, label: "Nifty 500 industries", tip: "The Nifty 500 grouped by industry: equal-weighted average of its stocks (ours)" }]} value={state.sec} onChange={(sec) => to({ sec })} light={false} />
      )}
      <div className="mb-heat" style={{ marginTop: 12 }}>
        {shown.map((t) => (
          <div key={t.name} className={`mb-heat-tile ${tone(t.v, state.per)}`} data-tip={t.tip}>
            <span className="n">{t.name}</span>
            <b data-src={t.src}>{t.v === null ? "—" : signed(t.v)}</b>
            <small>{t.sub}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
