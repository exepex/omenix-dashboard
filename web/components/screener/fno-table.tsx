"use client";
// The F&O rows (story W12; 33 notes row 11; India only): the nearest monthly future with its change, open interest and
// its change, the build-up, ATM IV against its 3-month range, put-call ratio, the move priced in by expiry and the lot.
// Every figure names its field (`fnoRows:rows[i].<field>`). The option chain is not built in the app yet.
import type { FnoScreenerRow, FnoScreenerRows } from "../../lib/screener/contract.ts";
import { SOON } from "../../lib/shell/nav.ts";
import { buildupOf } from "../../lib/screener/screens.ts";
import type { ScreenerState } from "../../lib/screener/state.ts";
import { dateShort } from "../../lib/shell/clock.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { useFrame } from "../frame/frame-context.tsx";
import { Chg, Num } from "../ui/figures.tsx";
import { Icon } from "../ui/icon.tsx";
import { Pager, useScreenerNav } from "./controls.tsx";

const L = "en-IN";
const at = (i: number, f: string) => sourceName("fnoRows", `rows[${i}].${f}`);

function Build({ r }: { r: FnoScreenerRow }) {
  const [, label, tone, icon, tip] = buildupOf(r.b);
  return <span className={`mb-label ${tone}`} data-tip={tip}><Icon name={icon} />{label}</span>;
}

function Iv({ r, i }: { r: FnoScreenerRow; i: number }) {
  if (r.iv === null) return <span className="muted" data-src={at(i, "iv")} data-tip="No IV: the at-the-money options did not trade today.">—</span>;
  return (
    <span className="mb-pos52" role="img" aria-label={`IV ${r.iv}%, ${r.ivr ?? "—"}% of its 3-month range`} data-tip={`ATM IV ${r.iv}% (ours, from the closes). 3-month range ${r.ivl}%–${r.ivh}% (days with 7+ days to expiry).`}>
      <b><Num value={r.iv} src={at(i, "iv")} decimals={String(r.iv).split(".")[1]?.length ?? 0} locale={L} unit="%" /></b>
      <span className="track"><i style={{ left: `${r.ivr ?? 0}%` }} /></span>
      <small>{r.ivr === null ? "" : <Num value={r.ivr} src={at(i, "ivr")} decimals={0} locale={L} unit="%" />}</small>
    </span>
  );
}

function Chain({ s }: { s: string }) {
  const { snack } = useFrame();
  return <button className="md-btn outlined small" type="button" onClick={() => snack(`${s} option chain: ${SOON}`)}><Icon name="layers" />Chain</button>;
}

export function FnoTable({ state, rows, sortKey }: { state: ScreenerState; rows: FnoScreenerRows; sortKey: string }) {
  const to = useScreenerNav(state);
  const { shell } = useFrame();
  const by = (x: string) => `by ${dateShort(`${x}T10:00:00Z`, shell).replace(/^\w+ /, "")}`;
  const move = (r: FnoScreenerRow, i: number) => (r.mv === null ? <span data-src={at(i, "mv")}>—</span> : <>±<Num value={r.mv} src={at(i, "mv")} decimals={String(r.mv).split(".")[1]?.length ?? 0} locale={L} unit="%" /></>);
  const pcr = (r: FnoScreenerRow, i: number) => <Num value={r.pcr} src={at(i, "pcr")} decimals={2} locale={L} />;
  const th = (label: string, k: string | null, tip: string, cls = "") => (
    <th className={cls} data-tip={tip} aria-sort={k && sortKey === k ? "descending" : k && sortKey === `-${k}` ? "ascending" : undefined}>
      {k ? <button type="button" onClick={() => to({ fsort: sortKey === k ? `-${k}` : k, page: 1 })}>{label}{sortKey.replace("-", "") === k ? <Icon name={sortKey.startsWith("-") ? "arrow_upward" : "arrow_downward"} /> : null}</button> : label}
    </th>
  );
  const name = (r: FnoScreenerRow) => <div className="nm"><b>{r.s}</b>{r.kind === "index" ? <span className="mb-tag">Index</span> : null}</div>;
  return (
    <>
      <div className="mb-scr-wrap">
        <table className="md-table mb-scr">
          <thead>
            <tr>
              {th("Underlying", null, "Stock or index")}
              {th("Future", "fc", "The nearest monthly future: close and change today", "num")}
              {th("Open interest", "oc", "Futures open interest change today", "num")}
              {th("Build-up", null, "Price and open interest together")}
              {th("ATM IV · 3-month range", "ivr", "At-the-money implied volatility (ours), and where it sits between its 3-month low (0%) and high (100%)")}
              {th("Put-call ratio", "pcr", "Put open interest ÷ call open interest, nearest monthly expiry", "num c-l")}
              {th("Move priced in", "mv", "ATM call + put closes against the price: the move, either way, paid for by expiry", "num")}
              {th("Lot", null, "Units in one lot (NSE)", "num c-l")}
              {th("", null, "")}
            </tr>
          </thead>
          <tbody>
            {rows.rows.map((r, i) => (
              <tr key={r.s}>
                <td>{name(r)}<small>{r.n}</small></td>
                <td className="num"><Num value={r.fut} src={at(i, "fut")} locale={L} /><small><Chg value={r.fc} src={at(i, "fc")} /></small></td>
                <td className="num"><Chg value={r.oc} src={at(i, "oc")} /><small><Num value={r.oi} src={at(i, "oi")} decimals={0} locale={L} /></small></td>
                <td><Build r={r} /></td>
                <td><Iv r={r} i={i} /></td>
                <td className="num c-l">{pcr(r, i)}</td>
                <td className="num">{move(r, i)}<small>{by(r.x)}</small></td>
                <td className="num c-l"><Num value={r.lot} src={at(i, "lot")} decimals={0} locale={L} /></td>
                <td className="act"><Chain s={r.s} /></td>
              </tr>
            ))}
            {rows.rows.length ? null : <tr><td colSpan={9} className="quiet">No underlying matches.</td></tr>}
          </tbody>
        </table>
        <ul className="mb-scr-cards" aria-label="Results">
          {rows.rows.map((r, i) => (
            <li key={r.s}>
              <div className="top">{name(r)}<span className="px"><Num value={r.fut} src={at(i, "fut")} locale={L} /> <Chg value={r.fc} src={at(i, "fc")} /></span></div>
              <div className="row"><Build r={r} /><span>OI <Chg value={r.oc} src={at(i, "oc")} /></span></div>
              <div className="row"><Iv r={r} i={i} /><span>PCR {pcr(r, i)}</span><span>Move {move(r, i)}</span></div>
              <div className="row"><Chain s={r.s} /></div>
            </li>
          ))}
        </ul>
      </div>
      <Pager total={rows.total} page={rows.page} size={rows.page_size} locale={L} go={(page) => to({ page })} />
    </>
  );
}
