"use client";
// The cells of one screener row (story W12; 33 notes row 7): the name with its F&O and Ours tags, the 52-week position,
// the volume against its usual, the tools' view for followed companies, and Buy / Sell. Every figure names its field
// (`stocks:rows[i].<field>`, `tools:companies[j].<field>`); the 52-week position and volume × usual are the contract's
// own formulas over the row's fields (computed: ours, notes row 7).
import type { ScreenerStock, ToolsCompany } from "../../lib/screener/contract.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { Tk } from "../frame/parts.tsx";
import { TradePair, TradeUnavailable } from "../frame/trade.tsx";
import { Num } from "../ui/figures.tsx";

export const rowSrc = (i: number, field: string) => sourceName("stocks", `rows[${i}].${field}`);
export const pos52 = (r: ScreenerStock) => (r.h !== null && r.l !== null && r.h > r.l ? Math.round(((r.p - r.l) / (r.h - r.l)) * 100) : null);
export const volRatio = (r: ScreenerStock) => (r.va ? r.v / r.va : null);

export function Name({ r, followed }: { r: ScreenerStock; followed: boolean }) {
  return (
    <div className="nm">
      {followed ? <Tk id={r.s} /> : <b>{r.s}</b>}
      {r.u.includes("fno") ? <span className="mb-tag" data-tip="Has futures and options on NSE">F&amp;O</span> : null}
      {r.u.includes("ours") ? <span className="mb-tag paper" data-tip="Followed by our tools">Ours</span> : null}
    </div>
  );
}

export function Pos52({ r, i, locale }: { r: ScreenerStock; i: number; locale: string }) {
  const p = pos52(r);
  if (p === null) return <span className="muted">—</span>;
  const f = (x: number | null) => (x === null ? "—" : x.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  return (
    <span className="mb-pos52" role="img" aria-label={`${p}% of the way from the 52-week low to the high`} data-tip={`52-week low ${f(r.l)}, high ${f(r.h)}`} data-derived={`${rowSrc(i, "h")} ${rowSrc(i, "l")}`}>
      <span className="track"><i style={{ left: `${p}%` }} /></span>
      <small>{`${p}%`}</small>
    </span>
  );
}

/** Volume against its usual; `brief` (the phone's card) leaves out the day's volume. */
export function Volume({ r, i, locale, brief = false }: { r: ScreenerStock; i: number; locale: string; brief?: boolean }) {
  const x = volRatio(r);
  return (
    <>
      <span data-derived={`${rowSrc(i, "v")} ${rowSrc(i, "va")}`}>{x === null ? "—" : `${x.toFixed(1)}×`}</span>
      {brief ? null : <small><Num value={r.v} src={rowSrc(i, "v")} decimals={0} locale={locale} /></small>}
    </>
  );
}

/** The stock tool's view of a followed company: strategies buying of those with a view, then results or the model. */
export function ToolsView({ c, j, horizon }: { c: ToolsCompany | undefined; j: number; horizon: number }) {
  if (!c) return <span className="muted" data-tip="Our tools do not follow this company: no strategy view.">—</span>;
  const at = (f: string) => sourceName("tools", `companies[${j}].${f}`);
  const d = c.days_to_results;
  const soon = d === null || d > 14 ? null : d === 0 ? <small>results due now</small> : <small>results in <span data-src={at("days_to_results")}>{d}</span>{` day${d === 1 ? "" : "s"}`}</small>;
  if (!c.strategies.of) return <span className="mb-scr-tools" data-tip="The stock tool recorded no strategy view for this company for this session."><b>No view today</b>{soon}</span>;
  const fam = (k: "rule" | "ai" | "baseline") => `${c.strategies.by_family[k]?.buy ?? 0} of ${c.strategies.by_family[k]?.of ?? 0}`;
  const tip = `${c.strategies.buy} of ${c.strategies.of} strategies buy for the next ${horizon} sessions (rule-based ${fam("rule")}, AI team ${fam("ai")}, baselines ${fam("baseline")}).${c.prob_up === null ? "" : ` Model: ${(c.prob_up * 100).toFixed(1)}% chance of a rise.`}`;
  return (
    <span className="mb-scr-tools" data-tip={tip}>
      <b><span data-src={at("strategies.buy")}>{c.strategies.buy}</span> of <span data-src={at("strategies.of")}>{c.strategies.of}</span> buy</b>
      {soon ?? (c.prob_up === null ? <small /> : <small>model <Num value={c.prob_up} src={at("prob_up")} scale={100} decimals={0} locale="en-US" unit="%" /> up</small>)}
    </span>
  );
}

/** Buy and Sell: a followed company trades through the frame's order window; any other is grey with the reason. */
export function BuySell({ r, followed }: { r: ScreenerStock; followed: boolean }) {
  return followed ? <TradePair id={r.s} variant="letter" className="bs" /> : <TradeUnavailable sym={r.s} reason={`Our tools do not follow ${r.s}: there are no price checks to fill a paper order. The stock tool can add a company.`} />;
}
