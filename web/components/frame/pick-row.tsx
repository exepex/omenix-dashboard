"use client";
// One buy pick of today (story W8; 30-shell "Today's buy picks panel" row): how many strategies agree, the price with
// its as-of, the pick in words, Yes or No after market costs with the number (NO red, YES green, glyph and word too),
// the picking strategy's own record on that stock, and Buy / Sell.
import { asOf } from "../../lib/shell/clock.ts";
import type { Signal } from "../../lib/shell/contract.ts";
import { signed } from "../../lib/ui/format.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";
import { ApBadge, Delta, Tk } from "./parts.tsx";
import { TradePair } from "./trade.tsx";

const pct1 = (x: number) => `${(x * 100).toFixed(1)}%`;

function Agreement({ x, sym }: { x: Signal; sym: string }) {
  const a = x.agree;
  const f = a.by_family;
  return (
    <span
      className="mb-score sm"
      style={{ ["--v" as string]: Math.round((a.buy / a.of) * 100) }}
      role="img"
      aria-label={`${a.buy} of ${a.of} strategies buy`}
      data-tip={`${a.buy} of ${a.of} strategies buy ${sym} at N+${x.horizon}: rule ${f.rule.buy} of ${f.rule.of}, AI ${f.ai.buy} of ${f.ai.of}, baselines ${f.baseline.buy} of ${f.baseline.of}.`}
    >
      <b>{`${a.buy}/${a.of}`}</b>
    </span>
  );
}

function AfterCosts({ x }: { x: Signal }) {
  const { data, fmt } = useFrame();
  const clears = x.exp_gain_pct > 0;
  const rules = x.pick_rules.map((k) => data.pick_rules[k]).join(" and ");
  const tip = `Expected gain after market costs of ${fmt.money(x.amount)}: ${pct1(x.prob_up)} × ${signed(x.move_pct)} − ${pct1(1 - x.prob_up)} × ${x.loss_pct}% − ${x.costs_pct}% costs. Picked by: ${rules}.`;
  return (
    <div className="cost">
      <span className={`mb-label ${clears ? "success" : "danger"}`} data-tip={tip}>
        <Icon name={clears ? "check" : "close"} />
        {clears ? `Yes: ${signed(x.exp_gain_pct)} after costs` : `No: ${signed(x.exp_gain_pct)} after costs, below costs`}
      </span>
    </div>
  );
}

function Record({ x, sym }: { x: Signal; sym: string }) {
  const { fmt } = useFrame();
  const r = x.record;
  if (!r) {
    return (
      <div className="proof" data-tip="No settled trade of this strategy on this stock yet.">
        <Icon name="history" />
        No record here yet
      </div>
    );
  }
  const won = Math.round(r.win_rate * r.trades);
  return (
    <div className="proof" data-tip={`${x.strategy} on ${sym} so far: ${r.trades} settled paper trades, ${won} won, net ${fmt.money(r.net_pnl, 2)}. Fewer than 20 is too few to rank.`}>
      <Icon name="history" />
      {`Record here: ${won} of ${r.trades} won, `}
      <span className={`mb-delta ${r.net_pnl > 0 ? "up" : r.net_pnl < 0 ? "down" : "flat"}`}>{fmt.money(r.net_pnl, undefined, true)}</span>
      {r.badge === "too_few_to_rank" ? " · too few to rank" : null}
    </div>
  );
}

export function PickRow({ x }: { x: Signal }) {
  const { data, item, fmt } = useFrame();
  const it = item(x.id);
  if (!it) return null;
  return (
    <li className="mb-sig-row" data-inst={x.id} tabIndex={0} aria-label={`${it.sym}: ${data.families[x.family].label} buy pick, ${x.agree.buy} of ${x.agree.of} strategies agree`}>
      <Agreement x={x} sym={it.sym} />
      <div className="top">
        <Tk id={x.id} />
        <ApBadge family={x.family} />
      </div>
      <div className="px">
        {fmt.price(it.last)}
        <small>
          <Delta value={it.chg_pct} />
          {` · ${asOf(it, data).short}`}
        </small>
      </div>
      <div className="why">
        <b>Picked to buy</b>
        {` at N+${x.horizon} · ${x.strategy} · model ${pct1(x.prob_up)} up`}
      </div>
      <AfterCosts x={x} />
      <Record x={x} sym={it.sym} />
      <TradePair id={x.id} className="act" />
    </li>
  );
}
