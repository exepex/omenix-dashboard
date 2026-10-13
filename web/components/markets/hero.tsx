"use client";
// The market today (story W12; 34 notes rows 3 and 4): the main index card (close, the period's change and chart, the
// 52-week range, NSE's own P/E, P/B and dividend yield in words) and the broad indices (US: benchmarks), each with its
// spark. Tap an index to chart it. Every figure names its field (`indices:indices[i].<field>`).
import type { OverviewIndices, OverviewQuote } from "../../lib/overview/contract.ts";
import type { MarketsState } from "../../lib/overview/state.ts";
import { PERIOD_LABEL, PERIOD_WORDS, isVolatility, periodCloses, pos52 } from "../../lib/overview/view.ts";
import { dateShort } from "../../lib/shell/clock.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { useFrame } from "../frame/frame-context.tsx";
import { Chg, Num } from "../ui/figures.tsx";
import { Line, Spark } from "./chart.tsx";
import { useMarketsNav } from "./nav.tsx";

const at = (i: number, f: string) => sourceName("indices", `indices[${i}].${f}`);

function Valuation({ q, i, locale }: { q: OverviewQuote; i: number; locale: string }) {
  if (q.pe == null) return null;
  const one = (x: number | null | undefined) => (x == null ? "—" : x.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  const facts: [string, React.ReactNode, string][] = [
    ["P/E", <Num key="pe" value={q.pe} src={at(i, "pe")} locale={locale} />, `price is ${one(q.pe)} times a year’s earnings`],
    ["P/B", <Num key="pb" value={q.pb} src={at(i, "pb")} locale={locale} />, `price is ${one(q.pb)} times book value`],
    ["Dividend yield", <Num key="dy" value={q.dy} src={at(i, "dy")} locale={locale} unit="%" />, "paid out a year on the price"],
  ];
  return <div className="val">{facts.map(([k, v, t]) => <div key={k} className="mb-fact"><span className="k">{k}</span><b>{v}</b><small>{t}</small></div>)}</div>;
}

function MainCard({ q, i, state, locale }: { q: OverviewQuote; i: number; state: MarketsState; locale: string }) {
  const { shell } = useFrame();
  const vals = periodCloses(q, state.per);
  const known = vals.filter((v): v is number => v !== null);
  const f = (x: number) => x.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const p = pos52(q);
  return (
    <section className="card" aria-label={q.name}>
      <div className="sec-head"><h2>{q.name}</h2><span className="sub">{`close of ${dateShort(`${q.as_of}T10:00:00Z`, shell)} · not live`}</span></div>
      <div className="big"><Num value={q.close} src={at(i, "close")} locale={locale} /><Chg value={q[state.per]} src={at(i, state.per)} /><span className="muted small">{PERIOD_WORDS[state.per]}</span></div>
      <Line vals={vals} label={`${q.name}, the last ${PERIOD_LABEL[state.per]}`} neutral={isVolatility(q)} />
      <div className="axis"><span>{`${vals.length - 1} sessions ago`}</span><span data-derived={at(i, "closes")}>{`low ${f(Math.min(...known))} · high ${f(Math.max(...known))}`}</span><span>today</span></div>
      <div className="mb-pos52" style={{ marginTop: 10 }} role="img" aria-label={`${p}% of the way from the 52-week low to the high`}>
        <small>52-week low <Num value={q.lo52} src={at(i, "lo52")} locale={locale} /></small>
        <span className="track"><i style={{ left: `${p ?? 0}%` }} /></span>
        <small>high <Num value={q.hi52} src={at(i, "hi52")} locale={locale} /></small>
      </div>
      <Valuation q={q} i={i} locale={locale} />
    </section>
  );
}

export function Hero({ indices, state, india, locale }: { indices: OverviewIndices; state: MarketsState; india: boolean; locale: string }) {
  const to = useMarketsNav(state);
  const rows = indices.indices.map((q, i) => ({ q, i })).filter(({ q }) => q.kind !== "sector");
  const main = rows.find(({ q }) => q.name === state.idx) ?? rows[0];
  return (
    <div className="hero">
      <MainCard q={main.q} i={main.i} state={state} locale={locale} />
      <section className="card" aria-label="Indices">
        <div className="sec-head"><h2>{india ? "Broad indices" : "Benchmarks"}</h2><span className="sub">Tap one to chart it</span></div>
        <ul className="list">
          {rows.map(({ q, i }) => (
            <li key={q.name}>
              <a className="pick" href="#" aria-current={q === main.q ? "true" : undefined} onClick={(e) => { e.preventDefault(); to({ idx: q.name }); }}>
                <b>{q.name}</b>
                <small>{isVolatility(q) ? "volatility: higher means more fear" : q.pe != null ? <>P/E <Num value={q.pe} src={at(i, "pe")} decimals={1} locale={locale} /></> : ""}</small>
              </a>
              <Spark vals={periodCloses(q, state.per)} neutral={isVolatility(q)} />
              <span className="r"><Num value={q.close} src={at(i, "close")} locale={locale} /><small><Chg value={q[state.per]} src={at(i, state.per)} /></small></span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
