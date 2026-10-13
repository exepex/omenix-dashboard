"use client";
// How nervous is the market and what index options say (India), or what interest rates say (US) (story W12; 34 notes
// rows 9 and 10). India VIX comes from the indices block (its 3-month middle is the median of its last 63 closes, as
// the contract defines); the index options are the F&O rows of the four index underlyings that trade; the US curve is
// the rates block. Every figure names its field.
import type { OverviewIndices, Rates } from "../../lib/overview/contract.ts";
import type { MarketsState } from "../../lib/overview/state.ts";
import { curveWords, middle63, periodCloses } from "../../lib/overview/view.ts";
import type { FnoScreenerRows } from "../../lib/screener/contract.ts";
import { buildupOf } from "../../lib/screener/screens.ts";
import { dateShort } from "../../lib/shell/clock.ts";
import { SOON } from "../../lib/shell/nav.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { useFrame } from "../frame/frame-context.tsx";
import { Chg, Num } from "../ui/figures.tsx";
import { Icon } from "../ui/icon.tsx";
import { Line } from "./chart.tsx";
import { Head } from "./nav.tsx";

const L = "en-IN";

export function Vix({ indices, state }: { indices: OverviewIndices; state: MarketsState }) {
  const i = indices.indices.findIndex((q) => q.kind === "vol");
  if (i < 0) return null;
  const vix = indices.indices[i];
  const vals = periodCloses(vix, state.per, 63);
  const mid = middle63(vix);
  const above = vix.close > mid;
  const at = (f: string) => sourceName("indices", `indices[${i}].${f}`);
  return (
    <section className="card" aria-label="India VIX">
      <Head title="How nervous is the market?" sub="India VIX: the volatility NIFTY options price in for the next 30 days" />
      <div className="big"><Num value={vix.close} src={at("close")} locale={L} /><Chg value={vix.d1} src={at("d1")} /><span className="muted small">today</span></div>
      <p className="small" style={{ margin: "4px 0 0" }}>
        {`${above ? "Above" : "Below"} its 3-month middle (`}<span data-derived={at("closes")}>{mid.toLocaleString(L, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        {`): options ${above ? "cost more" : "cost less"} than usual. Its year: `}<Num value={vix.lo52} src={at("lo52")} locale={L} />{" to "}<Num value={vix.hi52} src={at("hi52")} locale={L} />.
      </p>
      <Line vals={vals} label={`India VIX, the last ${vals.length - 1} sessions`} height={120} neutral />
      <div className="axis"><span>{`${vals.length - 1} sessions ago`}</span><span>today</span></div>
    </section>
  );
}

export function IndexOptions({ rows }: { rows: FnoScreenerRows }) {
  const { shell, snack } = useFrame();
  const at = (i: number, f: string) => sourceName("fnoRows", `rows[${i}].${f}`);
  const raw = (i: number, f: "iv" | "ivr" | "pcr" | "mv", v: number | null) => <span data-src={at(i, f)}>{v ?? "—"}</span>;
  const expiry = rows.rows[0]?.x;
  // the four by name, as signed off (34); each keeps its index in the block, the source of its figures
  const byName = rows.rows.map((r, i) => ({ r, i })).sort((a, b) => a.r.s.localeCompare(b.r.s));
  return (
    <section className="card" aria-label="Index options">
      <Head title="What do index options say?" sub={expiry ? `nearest monthly expiry, ${dateShort(`${expiry}T10:00:00Z`, shell)}` : undefined} go={<a className="go" href="#" onClick={(e) => { e.preventDefault(); snack(`NIFTY option chain: ${SOON}`); }}>NIFTY chain<Icon name="chevron_right" /></a>} />
      <ul className="list">
        {byName.map(({ r, i }) => {
          const [, label, toneName, icon] = buildupOf(r.b);
          return (
            <li key={r.s} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
              <span><b>{r.s}</b><small>IV {raw(i, "iv", r.iv)}% ({raw(i, "ivr", r.ivr)}% of its 3-month range) · put-call ratio {raw(i, "pcr", r.pcr)} · move priced in ±{raw(i, "mv", r.mv)}%</small></span>
              <span className={`mb-label ${toneName}`}><Icon name={icon} />{label}</span>
            </li>
          );
        })}
      </ul>
      <p className="muted small" style={{ margin: "10px 0 0" }}>IV computed by us from the at-the-money closes; build-up from the futures’ price and open interest (NSE file).</p>
    </section>
  );
}

export function Yields({ rates }: { rates: Rates }) {
  const { shell } = useFrame();
  const Y = rates.yields;
  const pick = (name: string) => Y.findIndex((y) => y.name === name);
  const [i10, i2] = [pick("10 Yr"), pick("2 Yr")];
  const at = (i: number) => sourceName("rates", `yields[${i}].value`);
  const lo = Math.min(...Y.map((y) => y.value)) - 0.1;
  const hi = Math.max(...Y.map((y) => y.value)) + 0.1;
  const h = 150;
  const points = Y.map((y, i) => `${((i / (Y.length - 1)) * 600).toFixed(1)},${(h - 8 - ((y.value - lo) / (hi - lo)) * (h - 16)).toFixed(1)}`).join(" ");
  const axis = [0, Math.floor(Y.length / 2), Y.length - 1];
  return (
    <section className="card" aria-label="Treasury yields">
      <Head title="What do interest rates say?" sub={`US Treasury par yields, ${dateShort(`${Y[0].date}T20:00:00Z`, shell)}`} />
      {i10 >= 0 && i2 >= 0 ? (
        <p className="small" style={{ margin: "0 0 6px" }}>
          10-year <span data-src={at(i10)}>{Y[i10].value}</span>% against 2-year <span data-src={at(i2)}>{Y[i2].value}</span>%: {curveWords(Y[i10].value, Y[i2].value)}.
        </p>
      ) : null}
      <svg viewBox={`0 0 600 ${h}`} preserveAspectRatio="none" role="img" aria-label="US Treasury yield curve" className="plot" style={{ height: h }}>
        <polyline points={points} fill="none" stroke="var(--mb-chart-1)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="axis">{axis.map((i) => <span key={i}>{Y[i].name} <span data-src={at(i)}>{Y[i].value}</span>%</span>)}</div>
    </section>
  );
}
