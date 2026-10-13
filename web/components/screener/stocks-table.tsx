"use client";
// The Screener's results (story W12; 33 notes rows 7 and 8): how many match and in what order, then one page of rows as
// a table (cards on a phone), then the pager. Columns sort through the route (W11's sort keys). The followed companies
// are lent to the frame at their close, so their Buy / Sell open the order window as in the signed-off page.
import { useEffect } from "react";
import type { ScreenerStock, ScreenerStocks, ScreenerTools } from "../../lib/screener/contract.ts";
import { TOOLS_ORDER_WORDS, isToolsScreen, screenDef, toolsOrder } from "../../lib/screener/screens.ts";
import { sortOf, type ScreenerState } from "../../lib/screener/state.ts";
import type { Instrument } from "../../lib/shell/contract.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { useFrame } from "../frame/frame-context.tsx";
import { Chg, Num } from "../ui/figures.tsx";
import { Icon } from "../ui/icon.tsx";
import { Pager, useScreenerNav } from "./controls.tsx";
import { PERIOD_LABEL, PERIOD_WORDS } from "./stocks-bar.tsx";
import { BuySell, Name, Pos52, ToolsView, Volume, rowSrc } from "./stocks-cells.tsx";

const SORT_WORDS: Record<string, string> = { value: "value traded today", pos: "closest to the 52-week high", "-pos": "closest to the 52-week low", abs: "biggest move today", vr: "volume against its usual", m1: "change in a month", "-m1": "biggest fall in a month", dl: "delivery", "-r": "lowest RSI", r: "highest RSI", p: "price", "-p": "lowest price" };

/** The followed rows as frame instruments at the day's close. */
function lend(rows: ScreenerStock[], asOf: string, followed: Set<string>): Record<string, Instrument> {
  return Object.fromEntries(rows.filter((r) => followed.has(r.s)).map((r) => [r.s, { id: r.s, kind: "stock", sym: r.s, code: r.s, name: r.n, last: r.p, chg_pct: r.d1, source: "close", as_of: asOf, state: "active" } satisfies Instrument]));
}

interface Props {
  state: ScreenerState;
  stocks: ScreenerStocks;
  tools: ScreenerTools;
  india: boolean;
  locale: string;
}

export function StocksTable({ state, stocks, tools, india, locale }: Props) {
  const to = useScreenerNav(state);
  const { addItems } = useFrame();
  const at = new Map(tools.companies.map((c, j) => [c.s, j]));
  const followed = new Set(at.keys());
  useEffect(() => addItems(lend(stocks.rows, stocks.as_of, new Set(tools.companies.map((c) => c.s)))), [stocks, tools, addItems]);
  const key = sortOf(state);
  const def = state.pre ? screenDef(state.pre) : undefined;
  const tooled = !state.sort && state.pre && isToolsScreen(state.pre) ? state.pre : null;
  const shown = tooled ? toolsOrder(stocks.rows, tools, tooled) : stocks.rows.map((r, i) => ({ r, i }));
  const words = tooled ? TOOLS_ORDER_WORDS[tooled] : key.replace("-", "") === "chg" ? `${key.startsWith("-") ? "biggest fall" : "change"} ${PERIOD_WORDS[state.per]}` : SORT_WORDS[key] ?? key;
  const th = (label: string, k: string | null, tip: string, cls = "") => (
    <th className={cls} data-tip={tip} aria-sort={k && key === k ? "descending" : k && key === `-${k}` ? "ascending" : undefined}>
      {k ? (
        <button type="button" onClick={() => to({ sort: key === k ? `-${k}` : k, page: 1 })}>
          {label}
          {key.replace("-", "") === k ? <Icon name={key.startsWith("-") ? "arrow_upward" : "arrow_downward"} /> : null}
        </button>
      ) : label}
    </th>
  );
  const tool = (r: ScreenerStock) => <ToolsView c={tools.companies[at.get(r.s) ?? -1]} j={at.get(r.s) ?? -1} horizon={tools.horizon_days} />;
  const n = (i: number, f: keyof ScreenerStock, d = 0, unit = "") => <Num value={stocks.rows[i][f] as number | null} src={rowSrc(i, f)} decimals={d} locale={locale} unit={unit} />;
  return (
    <>
      <p className="count">
        <b><Num value={stocks.total} src={sourceName("stocks", "total")} decimals={0} locale={locale} /> stocks</b>
        {def ? `· ${def.tip}` : ""}
        {`· sorted by ${words}`}
        {state.pre || Object.keys(state.filters).length ? <button className="md-btn text small" type="button" onClick={() => to({ pre: "", filters: {}, sort: "", page: 1 })}>Show all</button> : null}
      </p>
      <div className="mb-scr-wrap">
        <table className="md-table mb-scr">
          <thead>
            <tr>
              {th("Stock", null, "Symbol and name")}
              {th("Price", "p", "Close of the day", "num")}
              {th(`Change ${PERIOD_LABEL[state.per]}`, "chg", `Change ${PERIOD_WORDS[state.per]}`, "num")}
              {th("52-week range", "pos", "Where the close sits between the year’s low (0%) and high (100%)")}
              {th("Volume", "vr", "Today’s volume against its 20-day average", "num")}
              {india ? th("Delivery", "dl", "Share of traded shares taken for keeping (NSE)", "num c-l") : null}
              {th("RSI", "r", "RSI 14: above 70 often read as overbought, below 30 as oversold", "num c-l")}
              {th("Our tools", null, "The stock tool’s strategies (only the companies it follows)")}
              {th("", null, "")}
            </tr>
          </thead>
          <tbody>
            {shown.map(({ r, i }) => (
              <tr key={r.s} data-inst={followed.has(r.s) ? r.s : undefined}>
                <td><Name r={r} followed={followed.has(r.s)} /><small>{r.n}{r.g ? ` · ${r.g}` : ""}</small></td>
                <td className="num">{n(i, "p", 2)}</td>
                <td className="num"><Chg value={r[state.per]} src={rowSrc(i, state.per)} /></td>
                <td><Pos52 r={r} i={i} locale={locale} /></td>
                <td className="num"><Volume r={r} i={i} locale={locale} /></td>
                {india ? <td className="num c-l">{n(i, "dl", 0, "%")}</td> : null}
                <td className="num c-l">{n(i, "r")}</td>
                <td>{tool(r)}</td>
                <td className="act"><BuySell r={r} followed={followed.has(r.s)} /></td>
              </tr>
            ))}
            {stocks.rows.length ? null : <tr><td colSpan={9} className="quiet">No stock matches. Loosen a filter or pick another screen.</td></tr>}
          </tbody>
        </table>
        <ul className="mb-scr-cards" aria-label="Results">
          {shown.map(({ r, i }) => (
            <li key={r.s}>
              <div className="top"><Name r={r} followed={followed.has(r.s)} /><span className="px">{n(i, "p", 2)} <Chg value={r[state.per]} src={rowSrc(i, state.per)} /></span></div>
              <small>{r.n}</small>
              <div className="row">
                <Pos52 r={r} i={i} locale={locale} />
                <span>Vol <Volume r={r} i={i} locale={locale} brief /></span>
                {india && r.dl != null ? <span>Del {n(i, "dl", 0, "%")}</span> : null}
                {r.r !== null ? <span>RSI {n(i, "r")}</span> : null}
              </div>
              {followed.has(r.s) ? <div className="row">{tool(r)}<BuySell r={r} followed /></div> : null}
            </li>
          ))}
        </ul>
      </div>
      <Pager total={stocks.total} page={stocks.page} size={stocks.page_size} locale={locale} go={(page) => to({ page })} />
    </>
  );
}
