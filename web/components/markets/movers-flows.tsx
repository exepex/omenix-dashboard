"use client";
// Who moved most, and what big investors did (story W12; 34 notes rows 7 and 8). Movers are a page of the Screener's
// stocks block. Flows: FII/FPI and DII per day, each series on its own; the period's total is the block's published
// total, never added up here; when the days do not cover the period it shows "—" with the coverage (judge 27).
import type { Flows } from "../../lib/overview/contract.ts";
import type { MarketsState } from "../../lib/overview/state.ts";
import { PERIOD_LABEL, coverage } from "../../lib/overview/view.ts";
import type { ScreenerStocks } from "../../lib/screener/contract.ts";
import { dateShort } from "../../lib/shell/clock.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { useFrame } from "../frame/frame-context.tsx";
import { Tk } from "../frame/parts.tsx";
import { Segmented } from "../ui/controls.tsx";
import { Chg, Num } from "../ui/figures.tsx";
import { Icon } from "../ui/icon.tsx";
import { Head, useMarketsNav } from "./nav.tsx";

const L = "en-IN";
const crore = (x: number) => `${x < 0 ? "−" : "+"}₹${Math.abs(x).toLocaleString(L, { maximumFractionDigits: 0 })} cr`;

export function Movers({ movers, state, india, locale }: { movers: ScreenerStocks | null; state: MarketsState; india: boolean; locale: string }) {
  const to = useMarketsNav(state);
  const { item, go } = useFrame();
  const f = (x: number, d: number) => x.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  const at = (i: number, k: string) => sourceName("movers", `rows[${i}].${k}`);
  return (
    <section className="card" aria-label="Movers">
      <Head title="Who moved most today?" sub={india ? (state.mu === "all" ? "all NSE stocks that usually trade 1,00,000+ shares, priced ₹20+" : "within the Nifty 500") : "our 20 companies"} go={<a className="go" href="#" onClick={(e) => { e.preventDefault(); go("screener"); }}>Screener<Icon name="chevron_right" /></a>} />
      <div className="bar" style={{ marginTop: 0 }}>
        <Segmented label="List" options={[{ value: "gainers" as const, label: "Gainers" }, { value: "losers" as const, label: "Losers" }, { value: "active" as const, label: "Most traded" }]} value={state.mov} onChange={(mov) => to({ mov })} light={false} />
        {india ? <Segmented label="From" options={[{ value: "n500" as const, label: "Nifty 500" }, { value: "all" as const, label: "All NSE" }]} value={state.mu} onChange={(mu) => to({ mu })} light={false} /> : null}
      </div>
      {movers ? (
        <ul className="list">
          {movers.rows.map((r, i) => (
            <li key={r.s}>
              <span>{item(r.s) ? <Tk id={r.s} /> : <b>{r.s}</b>}<small data-security="">{r.n}</small></span>
              <span className="r"><Num value={r.p} src={at(i, "p")} locale={locale} /><small><Chg value={r.d1} src={at(i, "d1")} /></small></span>
              <span className="r small muted" data-derived={`${at(i, "p")} ${at(i, "v")} ${at(i, "va")}`}>
                {india ? `₹${f((r.p * r.v) / 1e7, 1)} cr` : `$${f((r.p * r.v) / 1e6, 0)}M`}
                <small>{r.va ? `${f(r.v / r.va, 1)}× usual` : ""}</small>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">No example data for this list yet: the examples cover the Nifty 500 gainers; this list shows once a backend publishes the rows.</p>
      )}
    </section>
  );
}

function Bar({ v, max, who, src }: { v: number; max: number; who: string; src: string }) {
  return (
    <span className={`mb-flowbar ${v >= 0 ? "in" : "out"}`} role="img" aria-label={`${who} ${v >= 0 ? "bought" : "sold"} ₹${Math.abs(v).toLocaleString(L, { maximumFractionDigits: 0 })} crore net`}>
      <i style={{ width: `${Math.round((Math.abs(v) / max) * 100)}%` }} />
      <span data-src={src}>{crore(v)}</span>
    </span>
  );
}

function Total({ flows, state }: { flows: Flows; state: MarketsState }) {
  const t = flows.totals[state.per];
  const at = (k: string) => sourceName("flows", `totals.${state.per}.${k}`);
  const why = coverage(t);
  if (why) return <p className="small" style={{ margin: "10px 0 0" }}>{`Over ${PERIOD_LABEL[state.per]}: `}<span data-src={at("fii")}>—</span>{` (${why}).`}</p>;
  const side = (x: number) => (x < 0 ? "sold" : "bought");
  return (
    <p className="small" style={{ margin: "10px 0 0" }}>
      {`Over these ${t.days_in_period} session${t.days_in_period === 1 ? "" : "s"} foreign investors ${side(t.fii!)} `}
      <span data-src={at("fii")} data-abs="">{`₹${Math.abs(t.fii!).toLocaleString(L, { maximumFractionDigits: 0 })}`}</span>
      {` crore net and domestic institutions ${side(t.dii!)} `}
      <span data-src={at("dii")} data-abs="">{`₹${Math.abs(t.dii!).toLocaleString(L, { maximumFractionDigits: 0 })}`}</span>
      {" crore."}
    </p>
  );
}

export function FlowsCard({ flows, state }: { flows: Flows; state: MarketsState }) {
  const { shell } = useFrame();
  const day = (d: string) => dateShort(`${d}T10:00:00Z`, shell);
  const max = Math.max(...flows.days.flatMap((d) => [Math.abs(d.fii.net), Math.abs(d.dii.net)]));
  const last = flows.nsdl.length - 1;
  const days = flows.days.map((d, i) => ({ d, i })).reverse();
  return (
    <section className="card" aria-label="Institutional flows">
      <Head title="What did big investors do?" sub="net buying (+) or selling (−) in the cash market, ₹ crore" />
      <ul className="list mb-flows">
        {days.map(({ d, i }) => (
          <li key={d.date}>
            <b>{day(d.date)}</b>
            <span><small>Foreign (FII/FPI)</small><Bar v={d.fii.net} max={max} who="Foreign investors" src={sourceName("flows", `days[${i}].fii.net`)} /></span>
            <span><small>Domestic (DII)</small><Bar v={d.dii.net} max={max} who="Domestic institutions" src={sourceName("flows", `days[${i}].dii.net`)} /></span>
          </li>
        ))}
      </ul>
      <Total flows={flows} state={state} />
      {last >= 0 ? (
        <p className="muted small" style={{ margin: "4px 0 0" }}>
          {`Provisional NSE figures up to ${day(flows.days[flows.days.length - 1].date)}; the latest day’s arrive the next morning. NSDL’s FPI equity flow (all routes) for ${day(flows.nsdl[last].date)}: `}
          <span data-src={sourceName("flows", `nsdl[${last}].net`)}>{crore(flows.nsdl[last].net)}</span>.
        </p>
      ) : null}
    </section>
  );
}
