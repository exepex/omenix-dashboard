"use client";
// The Strategy lab's scoreboard: every strategy ranked by profit after costs, its luck test and the test to be proven,
// and the pick-rule table of the head-to-head view (B16; split by W14). Names, families and results only: never how a
// strategy decides (owner, 13 Oct 2026).
import { FamilyLabel, Card, CardHead, Label, MoneyDelta, Quiet } from "../../../../../components/ui/primitives.tsx";
import { BACKTEST_YEARS, FAMILY_SHORT, GO_LIVE_MONTHS, GO_LIVE_TRADES_ABOUT, LUCK_INTERVAL_PCT, MIN_TRADES_TO_RANK, PICK_RULE } from "../../../../../lib/ui/constants.ts";
import { tooEarly } from "../../../../../lib/ui/empty.ts";
import { DASH, fmtDate, fmtDateYear, holdLabel, money, moneyDecimals, pct, signed } from "../../../../../lib/ui/format.ts";
import { byNetDesc, figure, rowsOf, tooFewToRank, type CostView, type ScoreboardRow } from "../../../../../lib/strategy-pages/scoreboard.ts";
import { ranking } from "../../../../../lib/strategy-pages/strategy-lab.ts";
import { LuckBar } from "../../_b16/parts.tsx";
import { NotStored, plural, type Payload, type View } from "./lab-shared.tsx";

function GoLiveChips({ row, currency }: { row: ScoreboardRow; currency: string }) {
  const g = row.go_live;
  if (!g) return <span className="muted">{DASH}</span>;
  const chip = (ok: boolean | null | undefined, text: string, tip: string) => (
    <Label tone={ok === true ? "success" : "neutral"} icon={ok === true ? "check" : ok === false ? "close" : "remove"} tip={tip}>{text}</Label>
  );
  return (
    <span className="gl">
      {chip(g.trades_needed === 0, g.trades_needed ? `${g.trades_needed} trades to go` : "trades ok", `About ${GO_LIVE_TRADES_ABOUT} finished trades are needed; ${g.trades_needed} still to go.`)}
      {chip(g.months_forward >= GO_LIVE_MONTHS, `${g.months_forward} of ${GO_LIVE_MONTHS} months`, `At least ${GO_LIVE_MONTHS} months of forward paper trading.`)}
      {chip(g.beats_best_baseline, g.beats_best_baseline ? "beats benchmark" : "behind benchmark", `Must beat the best simple benchmark after your fees (${money(currency, g.best_baseline_net_pnl, moneyDecimals(currency), true)}) with the corrected luck test excluding zero.`)}
    </span>
  );
}


export function Leaderboard({ p, v, selected, onSelect }: { p: Payload; v: View; selected: string; onSelect: (id: string) => void }) {
  const cur = p.currency, d = moneyDecimals(cur), { ids, byId } = ranking(p, v);
  const hzWords = v.horizon === "all" ? "all holding periods together" : `${holdLabel(Number(v.horizon))} only`;
  const viewWords = v.view === "accuracy" ? "all trades" : "rule vs AI";
  const other: CostView = v.cost === "your" ? "market" : "your";
  const head = (
    <CardHead title="Every strategy, ranked by profit after costs"
      help={`All ${ids.length} strategies of the registry (rule strategies, the three simple benchmarks, the AI traders) on the ${viewWords} view, ${v.basis === "backtest" ? "replayed on past years" : "real time"}, ${hzWords}. Ranked after market fees; the ${other}-fee figure sits under each profit. Fewer than ${MIN_TRADES_TO_RANK} finished trades is "too early to tell" and greyed: a handful of trades is mostly luck. The luck line shows the ${LUCK_INTERVAL_PCT}% interval of the mean return per trade, thin uncorrected and thick corrected for the rows compared at once; only a thick line clear of the zero tick counts as an edge. Click a name to see how that strategy is doing.`}
      end={`${viewWords} view · ${v.basis === "backtest" ? "replayed on past years" : "real time"} · ${hzWords} · data up to the ${fmtDate(p.as_of, false)} close · Paper`} />
  );
  const hasBack = p.rows.some((r) => r.basis === "backtest");
  if (v.basis === "backtest" && !hasBack) {
    return <Card label="Scoreboard">{head}<Quiet>{`No replay on past years yet. It is written by the weekly run on Friday evening (New York time). Replays cover only the strategies that can be replayed on past data, and are never mixed with real-time results.`}</Quiet></Card>;
  }
  const run = p.backtest_run;
  let rank = 0;
  return (
    <Card label="Scoreboard">
      {head}
      {v.basis === "backtest" && run ? (
        <div className="quiet" style={{ marginBottom: 10 }}>
          <b>Replay on past years. </b>
          {`Daily prices stored from ${fmtDateYear(run.first_date)} to ${fmtDateYear(run.last_date)}, ${run.history ? `with the ${BACKTEST_YEARS}-year history cache` : `without the ${BACKTEST_YEARS}-year history cache (not in the repository)`}${run.note ? `; ${run.note}` : ""}${run.eurusd ? `; EUR/USD: ${run.eurusd}` : ""}. Never mixed with real-time results; no targets or ranges, so those figures are empty.`}
        </div>
      ) : null}
      <div className="md-table-wrap">
        <table className="md-table tbl lb">
          <thead>
            <tr>
              <th className="cm">#</th><th>Strategy</th><th className="num">{`Profit after ${v.cost} cost`}</th><th className="num cm">Trades</th>
              <th className="num">Win rate</th><th className="num c2">Per trade</th><th className="num c2">Drawdown</th><th>Luck test</th><th className="c3">Test to be proven</th>
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => {
              const s = p.strategies[id], r = byId.get(id) ?? null;
              if (r) rank++;
              const net = r ? figure(r, "net_pnl", v.cost) : null, alt = r ? figure(r, "net_pnl", other) : null;
              const win = r ? figure(r, "win_rate", v.cost) : null, mean = r ? figure(r, "mean_return_pct", v.cost) : null;
              const dd = r ? figure(r, "max_drawdown", v.cost) : null, streak = r ? figure(r, "worst_losing_streak", v.cost) : null;
              const cls = [r ? (tooFewToRank(r) ? "few" : "") : "none", id === selected ? "on" : ""].filter(Boolean).join(" ");
              const notThere = v.horizon !== "all" && !s.horizons.includes(Number(v.horizon));
              return (
                <tr key={id} className={cls}>
                  <td className="rank cm">{r ? rank : DASH}</td>
                  <td>
                    <span className="nm">
                      <span className="t">
                        <button type="button" className="sel" aria-pressed={id === selected} onClick={() => onSelect(id)}>{s.name}</button>
                        <FamilyLabel family={s.family}>{FAMILY_SHORT[s.family]}</FamilyLabel>
                        {s.family === "baseline" ? <Label tone="neutral" tip="A simple benchmark: a strategy must beat the best one after your fees to count as proven.">benchmark</Label> : null}
                      </span>
                    </span>
                  </td>
                  <td className="num pn">
                    {r ? (
                      <span data-tip={`Profit after ${v.cost} cost ${net === null ? "not stored" : money(cur, net, d, true)} on ${plural(r.trades, "trade")}${alt !== null ? `; after ${other} cost ${money(cur, alt, d, true)}` : ""}. Ranked after market fees.`}>
                        <b>{net === null ? <NotStored /> : <MoneyDelta currency={cur} value={net} decimals={d} />}</b>
                        <small>{tooFewToRank(r) ? <Label tone="neutral">{tooEarly(r.trades)}</Label> : null}{alt !== null ? <span className="alt">{` ${other} cost ${money(cur, alt, d, true)}`}</span> : null}</small>
                      </span>
                    ) : (
                      <span className="muted" data-tip={`No finished trade in this slice yet${notThere ? ` (this strategy predicts ${s.horizons.join(", ")}-day holds only)` : ""}${v.basis === "backtest" ? ". Not run in the back-test: this strategy cannot be replayed on past data." : "."}`}>
                        {v.basis === "backtest" ? "not run" : "no trades yet"}
                      </span>
                    )}
                  </td>
                  <td className="num cm">{r ? r.trades : 0}</td>
                  <td className="num">{!r ? DASH : win === null ? <NotStored /> : <span data-tip={`${pct(win)} of ${plural(r.trades, "trade")} made money after ${v.cost} cost.`}>{pct(win)}</span>}</td>
                  <td className="num c2">{!r ? DASH : mean === null ? <NotStored /> : (
                    <span data-tip={`Mean return per trade after ${v.cost} cost, in percent of the amount. ${r.target_reached_rate === null ? "No targets or ranges in this basis." : `${pct(r.target_reached_rate)} of trades touched the target (typically in session ${r.median_reached_session ?? DASH}); ${pct(r.range_hit_rate)} of exit closes landed inside the 80% range; average miss of the target ${r.avg_target_error_pct === null ? DASH : signed(r.avg_target_error_pct)}.`}`}>{signed(mean)}</span>
                  )}</td>
                  <td className="num c2">{!r ? DASH : dd === null ? <NotStored /> : <span data-tip={`Deepest fall of cumulative profit from its peak: ${money(cur, dd, d, true)}; worst losing streak ${streak ?? DASH} trade${streak === 1 ? "" : "s"}.`}>{money(cur, dd, d, true)}</span>}</td>
                  <td>{r ? <LuckBar row={r} cost={v.cost} none="no interval" /> : <span className="muted">{DASH}</span>}</td>
                  <td className="c3">{r && r.go_live ? <GoLiveChips row={r} currency={cur} /> : <span className="muted">{DASH}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {v.basis === "backtest" ? <p className="note" style={{ marginTop: 8 }}>A strategy marked "not run" was not run in this back-test: it cannot be replayed on past data.</p> : null}
      {v.view === "head_to_head" ? <PickRuleTable p={p} v={v} /> : null}
    </Card>
  );
}

function PickRuleTable({ p, v }: { p: Payload; v: View }) {
  const cur = p.currency, rows = rowsOf(p.rows, "pick_rule", v.horizon, v.view, v.basis).sort(byNetDesc);
  if (!rows.length) return null;
  return (
    <>
      <div className="sub2" style={{ margin: "14px 0 0" }}>By family and pick rule (the head-to-head portfolios): gain-pick vs probability-pick.</div>
      <div className="md-table-wrap">
        <table className="md-table tbl co-tbl" style={{ marginTop: 14 }}>
          <thead><tr><th>Family × pick rule</th><th className="num">Trades</th><th className="num">{`Profit after ${v.cost} cost`}</th><th className="num">Win rate</th><th className="pr-luck">Luck test</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const net = figure(r, "net_pnl", v.cost), win = figure(r, "win_rate", v.cost);
              return (
                <tr key={`${r.family}-${r.pick_rule}`}>
                  <td><FamilyLabel family={r.family}>{FAMILY_SHORT[r.family]}</FamilyLabel> {PICK_RULE[r.pick_rule ?? ""] ?? r.pick_rule}</td>
                  <td className="num">{r.trades}</td>
                  <td className="num">{net === null ? <NotStored /> : <MoneyDelta currency={cur} value={net} decimals={moneyDecimals(cur)} />}</td>
                  <td className="num">{win === null ? <NotStored /> : pct(win)}</td>
                  <td className="pr-luck"><LuckBar row={r} cost={v.cost} none="no interval" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
