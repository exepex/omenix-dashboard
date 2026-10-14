"use client";
// The Strategy lab's heatmaps (strategy × holding period, company, market mood and reason) and the page legend
// (B16; split by W14). Results only: the number is in every cell, so colour never stands alone.
import { useState } from "react";
import { Segmented } from "../../../../../components/ui/controls.tsx";
import { HelpTip } from "../../../../../components/ui/icon.tsx";
import { Card, CardHead, Label, PaperTag, Quiet } from "../../../../../components/ui/primitives.tsx";
import { CURRENCY_SYMBOL, MIN_TRADES_TO_RANK, PAPER_LABEL } from "../../../../../lib/ui/constants.ts";
import { fmtDateYear, holdLabel, money, moneyDecimals, pct } from "../../../../../lib/ui/format.ts";
import { REGIME_WORDS, type ScoreboardRow } from "../../../../../lib/strategy-pages/scoreboard.ts";
import { cellValue, compactProfit, heatShares, heatWeeks, ranking, REASON, type HeatValue } from "../../../../../lib/strategy-pages/strategy-lab.ts";
import { Control } from "../../_b16/parts.tsx";
import { CompanyMap } from "./lab-company-map.tsx";
import { noneYet, plural, type Payload, type View } from "./lab-shared.tsx";

interface HeatColumn { label: string; full: string; key: string }

function Heat({ title, help, ids, cols, cellOf, p, metric }: {
  title: string; help: string; ids: string[]; cols: HeatColumn[]; cellOf: (id: string, col: HeatColumn) => HeatValue | null; p: Payload; metric: "net" | "win";
}) {
  const cur = p.currency, cells = ids.map((id) => cols.map((c) => cellOf(id, c))), shares = heatShares(cells.flat(), metric);
  return (
    <div className="hm">
      <h3>{title}<HelpTip tip={help} /></h3>
      <div className="md-table-wrap" tabIndex={0} role="region" aria-label={`${title}: scroll sideways for more columns`}>
        <table role="grid" aria-label={title}>
          <thead><tr><th className="r" />{cols.map((c) => <th key={c.key} scope="col" title={c.full}>{c.label}</th>)}</tr></thead>
          <tbody>
            {ids.map((id, i) => (
              <tr key={id}>
                <th className="r" scope="row" title={p.strategies[id]?.name}>{p.strategies[id]?.name ?? id}</th>
                {cols.map((c, j) => {
                  const x = cells[i][j];
                  if (!x) return <td key={c.key} className="e"><span>·</span></td>;
                  const share = shares[i * cols.length + j], up = metric === "net" ? x.net >= 0 : (x.win ?? 0) >= 0.5;
                  return (
                    <td key={c.key} tabIndex={0} style={{ background: `color-mix(in srgb, var(${up ? "--mb-heat-up" : "--mb-heat-down"}) ${share.toFixed(0)}%, var(--md-sys-color-surface-container-lowest))` }}
                      data-tip={`${p.strategies[id]?.name ?? id} × ${c.full}: ${plural(x.n, "trade")}, ${pct(x.win)} won, ${money(cur, x.net, moneyDecimals(cur), true)} after market cost.`}>
                      <span>{metric === "net" ? compactProfit(cur, x.net) : pct(x.win)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Heatmaps({ p, v, selected }: { p: Payload; v: View; selected: string }) {
  const [metric, setMetric] = useState<"net" | "win">("net");
  const [week, setWeek] = useState("all");
  const picked = heatWeeks(p.cells, v.view, v.basis, week);
  const cells = picked.cells;
  const strategyRows = p.rows.filter((r) => r.scope === "strategy" && r.view === v.view && r.basis === v.basis);
  const ids = Object.keys(p.strategies).filter((id) => (v.basis === "backtest" && strategyRows.some((r) => r.strategy_id === id)) || cells.some((c) => c.strategy_id === id));
  const end = (
    <>
      <Control label="Show"><Segmented label="Show" value={metric} onChange={setMetric} options={[{ value: "net", label: `Profit (${CURRENCY_SYMBOL[p.currency] ?? p.currency})` }, { value: "win", label: "Win rate" }]} /></Control>
      {v.basis === "backtest"
        ? <span className="muted">{p.backtest_run ? `back-test ${fmtDateYear(p.backtest_run.first_date)} – ${fmtDateYear(p.backtest_run.last_date)}` : "back-test"}</span>
        : <Control label="Week" help="The ISO week of the trades’ exit, or all weeks together (the cells are stored per week)."><Segmented label="Week" value={picked.week} onChange={setWeek} options={[{ value: "all", label: "All weeks" }, ...picked.weeks.map((w) => ({ value: w, label: w }))]} /></Control>}
    </>
  );
  const head = (
    <CardHead title="Where each strategy wins and loses" end={end}
      help="Heatmaps of profit after market fees or win rate by strategy × holding period, × market mood, × company (companies as rows, sorted by the strategy you choose) and × reason, for the selected view and basis. Green = profit (or win rate above half), red = loss, darker = larger; the number is in every cell, so colour never stands alone; a dot means no trade. The reason map is derived from the finished trades’ automatic reason (market, sector, news, company). The maps by horizon, company and reason read the cells per ISO week of exit, all weeks pooled by default (the Week control); the regime map is the scoreboard’s, all weeks." />
  );
  if (!ids.length) return <Card label="Heatmaps">{head}<Quiet>{noneYet(p)}</Quiet></Card>;
  const horizonCols = (p.horizons ?? []).map((k) => ({ label: `${k}d`, full: holdLabel(k), key: String(k) }));
  const tickers = [...new Set(cells.filter((c) => c.dimension === "company").map((c) => c.column))].sort();
  const rgRows = p.rows.filter((r) => r.scope === "strategy_regime" && r.view === v.view && r.basis === v.basis);
  const regimes = [...new Set(rgRows.map((r) => r.regime ?? ""))].sort();
  const rgIds = Object.keys(p.strategies).filter((id) => rgRows.some((r) => r.strategy_id === id));
  const codes = [...new Set(cells.filter((c) => c.dimension === "reason_code").map((c) => c.column))].sort();
  const fromRow = (r: ScoreboardRow | undefined): HeatValue | null => (r && r.net_pnl !== null ? { n: r.trades, net: r.net_pnl, win: r.win_rate } : null);
  return (
    <Card label="Heatmaps">
      {head}
      <div className="hms">
        <Heat title="By horizon" help="Which holding period works for each strategy." ids={ids} cols={horizonCols} p={p} metric={metric}
          cellOf={(id, c) => (v.basis === "forward" ? cellValue(cells, id, "horizon", c.key) : fromRow(strategyRows.find((x) => x.strategy_id === id && String(x.horizon_days) === c.key)))} />
        {regimes.length
          ? <Heat title={picked.week === "all" ? "By market regime" : "By market regime (all weeks)"} p={p} metric={metric} ids={rgIds}
            help="The market’s mood on the day of the prediction; the scoreboard stores this split for all weeks only, so this map does not follow the week picker."
            cols={regimes.map((r) => ({ label: REGIME_WORDS[r] ?? r, full: r, key: r }))} cellOf={(id, c) => fromRow(rgRows.find((x) => x.strategy_id === id && x.regime === c.key))} />
          : <Quiet>{v.basis === "backtest" ? "By market regime: the back-test stores no split by regime." : "By market regime: no per-regime row in this view yet."}</Quiet>}
        {tickers.length
          ? <CompanyMap p={p} cells={cells} ids={ids} ranked={ranking(p, v).ids} selected={selected} metric={metric} />
          : <Quiet>{v.basis === "backtest" ? "By company: the back-test stores no split by company." : "By company: no per-company row in this view yet."}</Quiet>}
        {codes.length
          ? <Heat title="By reason the price moved" p={p} metric={metric} ids={ids}
            help="The main cause of each finished trade’s move, from the automatic reason split: did the strategy make its money when the market lifted, when the sector did, on verified news, or on something company-specific?"
            cols={codes.map((c) => ({ label: REASON[c] ?? c, full: `${REASON[c] ?? c} (${c})`, key: c }))} cellOf={(id, c) => cellValue(cells, id, "reason_code", c.key)} />
          : null}
      </div>
      <div className="hmleg">
        <span>{metric === "net" ? "Profit after market cost:" : "Win rate:"}</span>
        <span className="sc" aria-hidden="true">
          <i style={{ background: "color-mix(in srgb, var(--mb-heat-down) 60%, var(--md-sys-color-surface-container-lowest))" }} />
          <i style={{ background: "color-mix(in srgb, var(--mb-heat-down) 25%, var(--md-sys-color-surface-container-lowest))" }} />
          <i style={{ background: "var(--md-sys-color-surface-container-low)" }} />
          <i style={{ background: "color-mix(in srgb, var(--mb-heat-up) 25%, var(--md-sys-color-surface-container-lowest))" }} />
          <i style={{ background: "color-mix(in srgb, var(--mb-heat-up) 60%, var(--md-sys-color-surface-container-lowest))" }} />
        </span>
        <span>{metric === "net" ? "loss … profit, darker = larger; the number is in every cell (k = thousand; the exact figure in the tooltip)" : "below half … above half; the number is in every cell"}</span>
        <span>· = no trade · every cell’s tooltip has the trade count</span>
      </div>
    </Card>
  );
}

export function Legend({ p }: { p: Payload }) {
  return (
    <div className="legend2" aria-label="Legend">
      <span>Legend (sample values): <span className="mb-delta up">+1.2%</span> up, <span className="mb-delta down">−1.2%</span> down, always with the sign</span>
      <span><i className="sw r" />rule <i className="sw b" />baselines <i className="sw a" />AI</span>
      <span><Label tone="success">edge</Label> the corrected luck interval lies above zero; <Label tone="neutral">luck?</Label> it includes zero; <Label tone="danger">loss</Label> it lies wholly below zero</span>
      <span><Label tone="neutral">too early to tell</Label>{` under ${MIN_TRADES_TO_RANK} finished trades`}</span>
      <span><PaperTag label={p.status.paper_label || PAPER_LABEL} /> every signal and trade until proven; nothing here is advice</span>
    </div>
  );
}
