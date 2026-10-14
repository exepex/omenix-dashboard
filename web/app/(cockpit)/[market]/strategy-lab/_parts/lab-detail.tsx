"use client";
// The Strategy lab's detail card: the selected strategy's results per holding period, market mood and company, and
// where it stands against the test to be proven (B16; split by W14). What it decided and how it did, never how it
// decides: no description, settings or chance threshold (owner, 13 Oct 2026; the API drops them too,
// lib/strategy-pages/public-strategies.ts).
import Link from "next/link";
import { Icon } from "../../../../../components/ui/icon.tsx";
import { Card, CardHead, FamilyLabel, Label, MoneyDelta, PaperTag, Quiet } from "../../../../../components/ui/primitives.tsx";
import { FAMILY, GO_LIVE_MONTHS, GO_LIVE_TRADES_ABOUT, PAPER_LABEL, regimeWords } from "../../../../../lib/ui/constants.ts";
import { DASH, fmtDate, holdLabel, holdTab, money, moneyDecimals, pct } from "../../../../../lib/ui/format.ts";
import { stockStrategiesPath } from "../../../../../lib/ui/routes.ts";
import { byNetDesc, figure, REGIME_WORDS, rowsOf, tooFewToRank, type ScoreboardRow } from "../../../../../lib/strategy-pages/scoreboard.ts";
import { forwardAccuracyRow } from "../../../../../lib/strategy-pages/strategy-lab.ts";
import { NotStored, plural, type Payload, type View } from "./lab-shared.tsx";

/** A signed bar around a middle line (the detail card's per-horizon and per-regime bars). */
function MiniRow({ label, value, max, text, tip }: { label: string; value: number | null; max: number; text: string; tip: string }) {
  const w = value === null ? 0 : (Math.abs(value) / max) * 50;
  return (
    <>
      <span className="l">{label}</span>
      <div className="bar">
        <s style={{ left: "50%" }} />
        {value !== null ? <i className={value >= 0 ? "up" : "dn"} style={value >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }} /> : null}
      </div>
      <b data-tip={tip}>{text}</b>
    </>
  );
}

/** The drawdown check's limit in words: the stock tool sets it at 10 times the market's paper-trade amount (₹10,00,000
 *  in India, $10,000 in the US; lab/constants.py DRAWDOWN_LIMIT_AMOUNTS, a proposal until the owner sets it). A missing
 *  or non-positive value is said as such, never drawn as a number. */
export function drawdownLimitWords(currency: string, limit: number | null | undefined): string {
  if (limit == null || !(limit > 0)) return "limit not available";
  return `proposed limit: the paper profit may fall at most ${money(currency, limit)} below its best point`;
}

export function Detail({ p, v, selected }: { p: Payload; v: View; selected: string }) {
  const cur = p.currency, d = moneyDecimals(cur), s = p.strategies[selected];
  if (!s) return <Card label="Strategy in plain words"><CardHead title="In plain words" /><Quiet>No strategy selected.</Quiet></Card>;
  const fwd = forwardAccuracyRow(p, selected);
  const perHorizon = (p.horizons ?? []).map((h) => rowsOf(p.rows, "strategy", h, v.view, v.basis).find((r) => r.strategy_id === selected) ?? null);
  const nets = (rows: (ScoreboardRow | null)[]) => rows.map((r) => (r ? figure(r, "net_pnl", v.cost) : null));
  const maxOf = (values: (number | null)[]) => Math.max(1, ...values.map((x) => Math.abs(x ?? 0)));
  const hzNets = nets(perHorizon), hzMax = maxOf(hzNets);
  const regimes = p.rows.filter((r) => r.scope === "strategy_regime" && r.view === v.view && r.basis === v.basis && r.strategy_id === selected);
  const rgNets = nets(regimes), rgMax = maxOf(rgNets);
  const companies = p.rows.filter((r) => r.scope === "strategy_company" && r.view === v.view && r.basis === v.basis && r.strategy_id === selected && String(r.horizon_days) === String(v.horizon))
    .sort(byNetDesc);
  const nameOf = (t: string) => p.companies.find((c) => c.ticker === t)?.name ?? t;
  const g = fwd?.go_live ?? null;
  const li = (ok: boolean | null | undefined, text: string, sub: string) => (
    <li className={ok === true ? "ok" : ok === false ? "no" : "na"}><Icon name={ok === true ? "check" : ok === false ? "close" : "remove"} /><span>{text}<small>{sub}</small></span></li>
  );
  return (
    <Card label="Strategy in plain words" className="det">
      <CardHead title="In plain words" end={<PaperTag label={p.status.paper_label || PAPER_LABEL} />}
        help="How the selected strategy is doing: its numbers per holding period, market mood and company in the selected view, and where it stands against the test to be proven (your fees). What it decided, never how it decides. Click another name in the scoreboard to switch." />
      <div className="big">
        {s.name}
        <FamilyLabel family={s.family}>{FAMILY[s.family][0]}</FamilyLabel>
        {s.live ? <span className="mb-tag live" data-tip="Paper only: no real money moves.">{s.live_from ? `Paper testing since ${fmtDate(s.live_from, false)}` : "Paper testing"}</span> : <span className="mb-tag" data-tip="Its paper test has not started; nothing trades for real anyway.">Not tested yet</span>}
      </div>
      {s.family === "baseline" ? <div className="diff"><Icon name="trending_flat" /><div><b>A simple benchmark, not a contender.</b> Strategies must beat the best one after your fees to count as proven.</div></div> : null}
      <div className="params">
        <span className="md-chip small" data-tip={`N+${s.horizons.join(", N+")}`}>{`${s.horizons.join(", ")}-day holds`}</span>
        <span className="md-chip small" data-tip={`Finished trades of this strategy in ${p.name}, all trades, real time (the registry’s ${s.settled_trades} counts both markets).`}>{`${fwd ? fwd.trades : 0} finished trades in ${p.name} (real time)`}</span>
      </div>
      <h3>{`Per horizon · ${v.view === "accuracy" ? "accuracy" : "head-to-head"} · ${v.cost} cost`}</h3>
      <div className="mini">
        {(p.horizons ?? []).map((h, i) => {
          const r = perHorizon[i], net = hzNets[i], win = r ? figure(r, "win_rate", v.cost) : null;
          const tip = r ? `${holdLabel(h)}: ${plural(r.trades, "trade")}, ${win === null ? "win rate not stored for this cost view" : `${pct(win)} won`}, ${net === null ? "profit not stored" : money(cur, net, d, true)} after ${v.cost} cost.` : s.horizons.includes(h) ? "No finished trade for this hold yet." : "This strategy does not predict this hold.";
          return <MiniRow key={h} label={holdTab(h)} value={net} max={hzMax} tip={tip} text={r ? `${net === null ? "not stored" : money(cur, net, d, true)} · ${r.trades}` : s.horizons.includes(h) ? DASH : "n/a"} />;
        })}
      </div>
      <h3>Per market mood at prediction time</h3>
      {regimes.length ? (
        <div className="mini">
          {regimes.map((r, i) => (
            <MiniRow key={r.regime ?? i} label={REGIME_WORDS[r.regime ?? ""] ?? r.regime ?? DASH} value={rgNets[i]} max={rgMax}
              text={`${rgNets[i] === null ? "not stored" : money(cur, rgNets[i], d, true)} · ${r.trades}`}
              tip={`${regimeWords(r.regime)}: ${r.trades} trades, ${pct(figure(r, "win_rate", v.cost))} won. Measured on its finished trades, by the market’s mood on the day of the prediction.`} />
          ))}
        </div>
      ) : <Quiet>{v.basis === "backtest" ? "The back-test stores no split by market mood." : "No finished trade in this view yet, so no split by market mood."}</Quiet>}
      <h3>{`Per company · ${v.horizon === "all" ? "all holding periods" : holdLabel(Number(v.horizon))}`}</h3>
      {companies.length ? (
        <div className="md-table-wrap">
          <table className="md-table tbl co-tbl">
            <thead><tr><th>Company</th><th className="num">Trades</th><th className="num">Profit</th><th className="num">Win rate</th><th><span className="mb-sr">Sample</span></th></tr></thead>
            <tbody>
              {companies.map((r) => {
                const net = figure(r, "net_pnl", v.cost), win = figure(r, "win_rate", v.cost), t = r.ticker ?? "";
                return (
                  <tr key={t}>
                    <td><Link className="tk" href={stockStrategiesPath(p.market, t)} data-tip={`${nameOf(t)}: every strategy on it (page 4).`}>{t}</Link></td>
                    <td className="num">{r.trades}</td>
                    <td className="num">{net === null ? <NotStored /> : <MoneyDelta currency={cur} value={net} decimals={d} />}</td>
                    <td className="num">{win === null ? <NotStored /> : pct(win)}</td>
                    <td>{tooFewToRank(r) ? <Label tone="neutral">too early to tell</Label> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <Quiet>{v.basis === "backtest" ? "The back-test stores no split by company." : "No finished trade on any company in this slice yet."}</Quiet>}
      <h3>Against the test to be proven (your fees)</h3>
      {g ? (
        <>
          <ul className="chk">
            {li(g.trades_needed === 0, g.trades_needed ? `${g.trades_needed} more finished trades needed` : "Enough finished trades", `about ${GO_LIVE_TRADES_ABOUT} per strategy, all trades`)}
            {li(g.months_forward >= GO_LIVE_MONTHS, `${g.months_forward} of ${GO_LIVE_MONTHS} months of forward paper trading`, "counted from the first forward trade")}
            {li(g.beats_best_baseline, g.beats_best_baseline ? "Beats the best baseline after your cost" : "Does not beat the best baseline after your cost yet", `best baseline ${money(cur, g.best_baseline_net_pnl, d, true)}; needs the corrected luck interval to lie above zero`)}
            {li(g.drawdown_within_limit, g.drawdown_within_limit ? "Drawdown within the limit" : g.drawdown_within_limit === false ? "Drawdown beyond the limit" : "Drawdown: not measured yet", drawdownLimitWords(cur, g.drawdown_limit))}
            {li(g.holds_in_calm_and_volatile, g.holds_in_calm_and_volatile === null || g.holds_in_calm_and_volatile === undefined ? "Calm and jumpy markets: not enough data yet" : g.holds_in_calm_and_volatile ? "Works in calm and jumpy markets" : "Fails in calm or in jumpy markets", "measured per market mood")}
          </ul>
          <p className="note">{g.proven ? "Proven: this strategy has passed the go-live test; Strong signals may appear." : `Not proven. ${p.status.paper_label || PAPER_LABEL}: nothing here is advice.`}</p>
        </>
      ) : <Quiet>{`This strategy has no finished paper trade yet${s.live_from ? `: its ${GO_LIVE_MONTHS}-month test started on ${fmtDate(s.live_from)}` : ""}.`}</Quiet>}
    </Card>
  );
}
