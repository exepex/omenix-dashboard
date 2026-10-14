"use client";
// The Strategy lab's switches (view, basis, costs, hold) and its four KPI picks (B16; split by W14).
import { Segmented } from "../../../../../components/ui/controls.tsx";
import { Kpi, KpiRow, Label, MoneyDelta } from "../../../../../components/ui/primitives.tsx";
import { BACKTEST_YEARS, GO_LIVE_MONTHS, GO_LIVE_TRADES_ABOUT, PAPER_LABEL } from "../../../../../lib/ui/constants.ts";
import { tooEarly } from "../../../../../lib/ui/empty.ts";
import { DASH, fmtDate, holdTab, moneyDecimals } from "../../../../../lib/ui/format.ts";
import { tooFewToRank, type ScoreboardRow } from "../../../../../lib/strategy-pages/scoreboard.ts";
import { kpiPicks, type Slice } from "../../../../../lib/strategy-pages/strategy-lab.ts";
import { Control } from "../../_b16/parts.tsx";
import { plural, type Payload, type View } from "./lab-shared.tsx";

/** The first day of real-time paper testing: the earliest live_from of the registry (config/strategies.yaml). */
const liveSinceOf = (p: Payload): string | null =>
  Object.values(p.strategies).map((s) => s.live_from).filter((d): d is string => !!d).sort()[0] ?? null;

export function Controls({ p, v, set }: { p: Payload; v: View; set: (v: View) => void }) {
  const liveSince = liveSinceOf(p);
  return (
    <div className="ctrls" role="group" aria-label="Scoreboard settings">
      <Control label="View" help="All trades: every prediction a strategy made becomes a paper trade, so each strategy is judged on everything it said. Rule vs AI: only the daily picks of the two best (the best rule strategy vs the best AI trader), on the same companies and days.">
        <Segmented label="View" value={v.view} onChange={(view) => set({ ...v, view })} options={[{ value: "accuracy", label: "All trades" }, { value: "head_to_head", label: "Rule vs AI" }]} />
      </Control>
      <Control label="Basis" help={`Real time: paper trades made before each session’s open. Replayed on past years: the strategies that can be replayed, on the stored history (the ${BACKTEST_YEARS}-year cache when the run used it). Replayed results say what would have happened; real-time results say what did. They are never mixed.`}>
        <Segmented label="Basis" value={v.basis} onChange={(basis) => set({ ...v, basis })} options={[{ value: "forward", label: liveSince ? `Since ${fmtDate(liveSince, false)} (real time)` : "Real time" }, { value: "backtest", label: "Replayed on past years" }]} />
      </Control>
      <Control label="Costs" help="Market fees: brokerage, taxes and exchange fees; strategies are ranked on them. Your fees also count your own broker’s extra charges (India: the depository charge on each sale; US: FX markup and the portfolio fee); the test that decides whether a strategy is proven uses your fees. The ranking does not change with this switch; the numbers do.">
        <Segmented label="Costs" value={v.cost} onChange={(cost) => set({ ...v, cost })} options={[{ value: "market", label: "Market cost" }, { value: "your", label: "Your cost" }]} />
      </Control>
      <Control label="Hold" help={`All holding periods together, or one k-day hold (N+k: buy at the open, sell at the close k trading days later). A strategy with no finished trade for a hold shows "no trades yet".`}>
        <Segmented<string> label="Horizon" value={String(v.horizon)} onChange={(h) => set({ ...v, horizon: h === "all" ? "all" : Number(h) })}
          options={["all", ...(p.horizons ?? []).map(String)].map((k) => ({ value: k, label: k === "all" ? "All" : holdTab(Number(k)) }))} />
      </Control>
    </div>
  );
}

export function Kpis({ p, slice }: { p: Payload; slice: Slice }) {
  const cur = p.currency, k = kpiPicks(p, slice), name = (row: ScoreboardRow | null) => (row ? p.strategies[row.strategy_id]?.name ?? row.strategy_id : DASH);
  return (
    <KpiRow>
      <Kpi icon="query_stats" tone="success" label="Leading after market cost" value={k.leader ? name(k.leader) : "No trades yet"}
        tip="The strategy with the highest profit after market cost in the selected view, basis and horizon. With few trades the lead is mostly luck."
        sub={k.leader ? <span><MoneyDelta currency={cur} value={k.leader.net_pnl} decimals={moneyDecimals(cur)} />{` on ${plural(k.leader.trades, "trade")} `}{tooFewToRank(k.leader) ? <Label tone="neutral">{tooEarly(k.leader.trades)}</Label> : null}</span> : "nothing finished in this slice yet"} />
      <Kpi icon="trending_flat" tone="warn" label="Simple benchmark to beat" value={name(k.bestBaseline)}
        tip="A deliberately simple strategy, for example “always buy” (the best of three: Always buy, Follow yesterday, Baseline 3). If a clever strategy can’t beat it after fees, it isn’t adding anything."
        sub={k.bestBaseline ? <span><MoneyDelta currency={cur} value={k.bestBaseline.net_pnl} decimals={moneyDecimals(cur)} />{` on ${plural(k.bestBaseline.trades, "trade")}`}</span> : "no baseline trade yet"} />
      <Kpi icon="layers" tone="info" label="Beat the benchmark" value={k.bestBaseline ? `${k.beat} of ${k.contenders}` : DASH}
        tip="How many rule strategies and AI traders with settled trades are ahead of the best baseline in this slice, before the luck test."
        sub={k.bestBaseline ? "strategies ahead of the best baseline after market cost" : "needs a baseline row"} />
      <Kpi icon="schedule" tone="paper" label="Closest to being proven" value={name(k.nearest)}
        tip={`The test a strategy must pass (after your fees): about ${GO_LIVE_TRADES_ABOUT} finished trades, ${GO_LIVE_MONTHS} months of real-time paper trading, beating the best simple benchmark beyond luck, losses within the limit, and working in calm and jumpy markets. ${p.status.paper_label || PAPER_LABEL}.`}
        sub={k.nearest?.go_live ? `${k.nearest.go_live.trades_needed} trades and ${Math.max(0, GO_LIVE_MONTHS - k.nearest.go_live.months_forward).toFixed(1)} months to go` : "no rule strategy or AI trader with finished trades in this slice yet"} />
    </KpiRow>
  );
}
