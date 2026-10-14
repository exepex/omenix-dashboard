"use client";
// The Strategy lab's "By company" map (owner, 13 Oct 2026: about 20 companies as columns never fit beside the other
// maps; labels ran into each other and values were cut off). Companies are rows, with their full names; strategies are
// columns, as many as the card's width holds whole (the chosen strategy first, then the scoreboard's order; one on a
// phone, with a selector); every cell shows its full signed value. Rows are sorted by the chosen strategy's result
// (worst or best first); the first 8 show, the rest behind "Show all". The card takes the full width and only ever
// grows downwards.
import { useState } from "react";
import { Segmented } from "../../../../../components/ui/controls.tsx";
import { HelpTip } from "../../../../../components/ui/icon.tsx";
import { money, moneyDecimals, pct } from "../../../../../lib/ui/format.ts";
import { useWidth } from "../../../../../lib/ui/use-width.ts";
import { cellValue, compactProfit, heatShares, type HeatValue, type HeatmapCell } from "../../../../../lib/strategy-pages/strategy-lab.ts";
import { plural, type Payload } from "./lab-shared.tsx";

const FIRST = 8, NAME_COL = 220, COL = 92;
type Order = "worst" | "best";

/** How many strategy columns the card's width holds with every value whole (one below 600 px). */
export const columnsThatFit = (width: number | null): number => (width === null || width < 600 ? 1 : Math.max(1, Math.floor((width - NAME_COL) / COL)));

export function CompanyMap({ p, cells, ids, ranked, selected, metric }: {
  p: Payload; cells: HeatmapCell[]; ids: string[]; ranked: string[]; selected: string; metric: "net" | "win";
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [pick, setPick] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>("worst");
  const [all, setAll] = useState(false);
  const chosen = pick && ids.includes(pick) ? pick : ids.includes(selected) ? selected : ids[0];
  const columns = [chosen, ...ranked.filter((id) => ids.includes(id) && id !== chosen), ...ids.filter((id) => id !== chosen && !ranked.includes(id))].slice(0, columnsThatFit(width));
  const value = (x: HeatValue | null) => (x === null ? null : metric === "net" ? x.net : x.win ?? null);
  const tickers = [...new Set(cells.filter((c) => c.dimension === "company").map((c) => c.column))];
  const sign = order === "worst" ? 1 : -1;
  const rows = tickers.map((t) => ({ t, name: p.companies.find((c) => c.ticker === t)?.name ?? t, own: value(cellValue(cells, chosen, "company", t)) }))
    .sort((a, b) => (a.own === null ? 1 : 0) - (b.own === null ? 1 : 0) || sign * ((a.own ?? 0) - (b.own ?? 0)) || a.name.localeCompare(b.name));
  const shown = all ? rows : rows.slice(0, FIRST);
  const grid = shown.map((r) => columns.map((id) => cellValue(cells, id, "company", r.t)));
  const shares = heatShares(grid.flat(), metric);
  const name = (id: string) => p.strategies[id]?.name ?? id;
  const cur = p.currency;
  return (
    <div className="hm wide cm" ref={ref}>
      <h3>By company<HelpTip tip="Each company’s result for each strategy (all holding periods pooled), sorted by the strategy you choose. A per-company lead on a handful of trades is mostly luck; the Stock strategies page shows the luck test." /></h3>
      <div className="cm-ctl">
        <label className="cm-pick">
          <span>Sort by</span>
          <select className="mb-input" value={chosen} onChange={(e) => setPick(e.target.value)} aria-label="Strategy to sort the companies by">
            {ids.map((id) => <option key={id} value={id}>{name(id)}</option>)}
          </select>
        </label>
        <Segmented label="Order" value={order} onChange={setOrder} options={[{ value: "worst", label: "Worst first" }, { value: "best", label: "Best first" }]} />
      </div>
      <table aria-label="By company">
        <thead>
          <tr><th className="r" scope="col">Company</th>{columns.map((id) => <th key={id} scope="col">{name(id)}</th>)}</tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={r.t}>
              <th className="r" scope="row"><span className="cm-name">{r.name}</span><small>{r.t}</small></th>
              {columns.map((id, j) => {
                const x = grid[i][j];
                if (!x) return <td key={id} className="e"><span>·</span></td>;
                const share = shares[i * columns.length + j], up = metric === "net" ? x.net >= 0 : (x.win ?? 0) >= 0.5;
                return (
                  <td key={id} tabIndex={0} style={{ background: `color-mix(in srgb, var(${up ? "--mb-heat-up" : "--mb-heat-down"}) ${share.toFixed(0)}%, var(--md-sys-color-surface-container-lowest))` }}
                    data-tip={`${name(id)} × ${r.name}: ${plural(x.n, "trade")}, ${pct(x.win)} won, ${money(cur, x.net, moneyDecimals(cur), true)} after market cost.`}>
                    <span>{metric === "net" ? compactProfit(cur, x.net) : pct(x.win)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cm-foot">
        {rows.length > FIRST ? <button type="button" className="md-btn text small" aria-expanded={all} onClick={() => setAll(!all)}>{all ? `Show the first ${FIRST}` : `Show all ${rows.length} companies`}</button> : null}
        {columns.length < ids.length ? <span className="muted">{`${columns.length} of ${ids.length} strategies fit here; choose another in “Sort by” to see it.`}</span> : null}
      </div>
    </div>
  );
}
