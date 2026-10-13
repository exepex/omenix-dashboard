"use client";
// Home section 5 (story W9; 31 notes.md row 5): the open paper trades. Yours first, then each family's trades grouped
// per stock; every row says bought (long) or sold (short); tabs by who opened them, with counts; six rows a page. A
// group shows each trade's own profit or loss, never a sum. B and S trade your own account (the frame's lock applies).
import { useEffect, useState } from "react";
import { asOf, dateShort } from "../../lib/shell/clock.ts";
import type { Positions, StrategyTrades } from "../../lib/home/contract.ts";
import { TABS, TRADES_PAGE, groupFigures, ownPct, rowsOf, tradeRows, type Tab, type TradeRow } from "../../lib/home/trades.ts";
import { LOCALE } from "../../lib/ui/constants.ts";
import { signed } from "../../lib/ui/format.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "../frame/frame-context.tsx";
import { ApBadge, Tk } from "../frame/parts.tsx";
import { TradePair } from "../frame/trade.tsx";
import { src } from "../../lib/home/sources.ts";
import { Money, MoneyDelta, SectionHead } from "./section-head.tsx";

function Side({ qty }: { qty: number }) {
  return qty >= 0 ? (
    <span className="mb-label success" data-tip="A buy (long): it gains when the price rises."><Icon name="arrow_upward" />Bought</span>
  ) : (
    <span className="mb-label danger" data-tip="A sell (short): it gains when the price falls."><Icon name="arrow_downward" />Sold</span>
  );
}

function Row({ r, sessionDate }: { r: TradeRow; sessionDate: string }) {
  const { data, shell, fmt, item } = useFrame();
  if (r.kind === "own") {
    const p = r.position;
    const it = item(p.id);
    return (
      <li>
        <div className="w">
          <div className="nm"><Side qty={p.qty} /><Tk id={p.id} /><ApBadge family="manual" /></div>
          <small>{`Your trade · ${p.source}`}</small>
        </div>
        <div className="q">
          <span>{`${Math.abs(p.qty).toLocaleString(LOCALE[shell.currency] ?? "en-US", { maximumFractionDigits: 0 })} × ${fmt.price(p.avg)}`}</span>
          <small>{`last ${fmt.price(p.last)}${it ? " · " + asOf(it, data).short : ""}`}</small>
        </div>
        <div className="p"><MoneyDelta value={p.unrealised} src={src("positions", `own[${r.at}].unrealised`)} /><small>{signed(ownPct(p))}</small></div>
        <div className="a"><TradePair id={p.id} variant="letter" /></div>
      </li>
    );
  }
  const g = groupFigures(r.entries);
  const n = r.entries.length;
  const at = (e: { at: number }, field: string) => src("strategyTrades", `strategy_trades[${e.at}].${field}`);
  const exits = g.exits.map((d) => dateShort(`${d}T06:00:00Z`, shell) + (d === sessionDate ? " (today)" : "")).join(", ");
  return (
    <li>
      <div className="w">
        <div className="nm"><Side qty={r.entries[0].trade.qty} /><Tk id={r.id} /><ApBadge family={r.family} /></div>
        <small>{`${n} trade${n > 1 ? "s" : ""}: ${g.strategies.join(", ")} · N+${g.horizons.join(", N+")}`}</small>
      </div>
      <div className="q"><span><Money value={g.amount.trade.amount} src={at(g.amount, "amount")} /> each</span><small>{`exits ${exits}`}</small></div>
      <div className="p">
        {g.same ? <MoneyDelta value={g.same.trade.unrealised} src={at(g.same, "unrealised")} /> : <span><MoneyDelta value={g.low.trade.unrealised} src={at(g.low, "unrealised")} /> to <MoneyDelta value={g.high.trade.unrealised} src={at(g.high, "unrealised")} /></span>}
        <small>{g.pct !== null ? signed(g.pct) : "each trade"}</small>
      </div>
      <div className="a"><TradePair id={r.id} variant="letter" /></div>
    </li>
  );
}

export function OpenTrades({ positions, trades, sessionDate }: { positions: Positions; trades: StrategyTrades; sessionDate: string }) {
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(0);
  // The mockup's state link: #own=ai opens a tab directly (bookmarks and screenshots).
  useEffect(() => {
    const own = new URLSearchParams(window.location.hash.slice(1)).get("own");
    const found = TABS.find(([k]) => k === own);
    if (found) setTab(found[0]);
  }, []);
  const all = tradeRows(positions.own, trades.strategy_trades);
  const rows = rowsOf(all, tab);
  const pages = Math.max(1, Math.ceil(rows.length / TRADES_PAGE));
  const at = Math.min(page, pages - 1);
  const shown = rows.slice(at * TRADES_PAGE, at * TRADES_PAGE + TRADES_PAGE);
  return (
    <div className="sec">
      <section className="card" aria-label="Open paper trades">
        <SectionHead title="Open paper trades" sub="Each row says whether it was bought (long) or sold (short). Yours first, then each approach’s trades by stock. B and S trade your own account." go={["Portfolio", "portfolios"]} />
        <div className="md-segmented dense tabs" role="group" aria-label="Who opened the trade">
          {TABS.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => { setTab(k); setPage(0); }}>{`${label} (${rowsOf(all, k).length})`}</button>
          ))}
        </div>
        <ul className="pos">
          {shown.map((r) => <Row key={`${r.kind}:${r.id}:${r.family}`} r={r} sessionDate={sessionDate} />)}
          {rows.length ? null : <li className="quiet">Nothing open here.</li>}
        </ul>
        <div className="pager">
          <span>{rows.length ? `${at * TRADES_PAGE + 1}–${Math.min(rows.length, (at + 1) * TRADES_PAGE)} of ${rows.length}` : ""}</span>
          <button className="md-icon-btn small" type="button" aria-label="Previous page" disabled={at === 0} onClick={() => setPage(at - 1)}><Icon name="chevron_left" /></button>
          <button className="md-icon-btn small" type="button" aria-label="Next page" disabled={at >= pages - 1} onClick={() => setPage(at + 1)}><Icon name="chevron_right" /></button>
        </div>
      </section>
    </div>
  );
}
