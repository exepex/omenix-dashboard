"use client";
// The Strategy lab's cumulative profit lines by exit date (B16; split by W14).
import { useState, type KeyboardEvent } from "react";
import { Card, CardHead, PaperTag, Quiet } from "../../../../../components/ui/primitives.tsx";
import { FAMILY_SHORT, PAPER_LABEL, PICK_RULE } from "../../../../../lib/ui/constants.ts";
import { fmtDate, fmtDateYear, money, moneyDecimals } from "../../../../../lib/ui/format.ts";
import { niceTicks } from "../../../../../lib/strategy-pages/scoreboard.ts";
import { colouredSeries, cumulativeSeries } from "../../../../../lib/strategy-pages/strategy-lab.ts";
import { useWidth } from "../../../../../lib/ui/use-width.ts";
import { noneYet, plural, type Payload, type View } from "./lab-shared.tsx";

export function CumulativeCard({ p, v, selected }: { p: Payload; v: View; selected: string }) {
  return (
    <Card label="Cumulative profit">
      <CardHead title="Cumulative profit after market cost" end={<PaperTag label={p.status.paper_label || PAPER_LABEL} />}
        help="Each line adds up a strategy’s finished paper trades after fees by exit date, in the selected view; market fees here, since the trades carry that view. The selected strategy and the three with the highest cumulative profit are coloured and named (colours follow the registry order, not the rank); the rest are grey; the selected one is thick. Strategies with identical trades draw on top of each other; the tooltip lists each. Hover or use the arrow keys to read a date." />
      <CumulativeChart p={p} v={v} selected={selected} />
    </Card>
  );
}

function CumulativeChart({ p, v, selected }: { p: Payload; v: View; selected: string }) {
  const [ref, hostWidth] = useWidth<HTMLDivElement>();
  const [at, setAt] = useState<number | null>(null);
  const cur = p.currency, d = moneyDecimals(cur);
  const { dates, series } = cumulativeSeries(p.lines, v.view, v.basis);
  const registry = Object.keys(p.strategies);
  const nameOf = (id: string) => p.strategies[id]?.name ?? id.split(":").map((w, i) => (i === 0 ? FAMILY_SHORT[w as keyof typeof FAMILY_SHORT] ?? w : PICK_RULE[w] ?? w)).join(" · ");
  if (!dates.length) {
    return <div className="cum" ref={ref}><Quiet>{v.basis === "forward" ? noneYet(p) : "The replay on past years stores no trades and no lines, only its scoreboard rows, and is never mixed with real-time trades."}</Quiet></div>;
  }
  const coloured = colouredSeries(series, selected, registry);
  const klass = (id: string) => (coloured.includes(id) ? `k${coloured.indexOf(id) + 1}` : "grey");
  const W = Math.max(280, hostWidth ?? 560), phone = W < 560, H = phone ? 240 : 280, L = phone ? 52 : 64, T = 14, B = 26;
  const labelOf = (id: string) => { const n = nameOf(id); return n.length > 22 ? n.slice(0, 21) + "…" : n; };
  const R = phone ? 12 : Math.min(Math.round(W * 0.34), Math.max(90, ...coloured.map((id) => Math.round(labelOf(id).length * 6.4 + 16))));
  const values = series.flatMap((s) => s.points);
  let lo = Math.min(0, ...values), hi = Math.max(0, ...values);
  const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
  const X = (i: number) => L + (dates.length === 1 ? (W - L - R) / 2 : (i / (dates.length - 1)) * (W - L - R));
  const Y = (value: number) => T + ((hi - value) / (hi - lo)) * (H - T - B);
  const ordered = series.slice().sort((a, b) => Number(a.id === selected) - Number(b.id === selected) || Number(coloured.includes(a.id)) - Number(coloured.includes(b.id)));
  const labels = phone ? [] : (() => {
    const items = coloured.map((id) => ({ id, y: Y(series.find((s) => s.id === id)!.last) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 13) items[i].y = items[i - 1].y + 13;
    const over = items.length ? items[items.length - 1].y - (H - B - 4) : 0;
    if (over > 0) for (const it of items) it.y -= over;
    return items;
  })();
  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setAt((old) => (old === null ? dates.length - 1 : Math.max(0, Math.min(dates.length - 1, old + (event.key === "ArrowRight" ? 1 : -1)))));
    } else if (event.key === "Escape") setAt(null);
  };
  const onMove = (event: React.PointerEvent<SVGRectElement>) => {
    const box = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const x = (event.clientX - box.left) * (W / box.width);
    let best = 0;
    dates.forEach((_, i) => { if (Math.abs(X(i) - x) < Math.abs(X(best) - x)) best = i; });
    setAt(best);
  };
  const others = series.length - coloured.length;
  return (
    <div className="cum" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" tabIndex={0} onKeyDown={onKey} onBlur={() => setAt(null)}
        aria-label={`Cumulative profit after market cost by exit date, ${series.length} ${v.view === "accuracy" ? "strategies" : "family and pick-rule lines"}, ${plural(dates.length, "date")}. Use the arrow keys to read each date.`}>
        <g className="grid">{niceTicks(lo, hi, 4).map((t) => <line key={t} x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} />)}</g>
        <line className="zero" x1={L} x2={W - R} y1={Y(0)} y2={Y(0)} />
        {ordered.map((s) => {
          const k = klass(s.id);
          return (
            <g key={s.id}>
              <polyline className={`ln ${k}${s.id === selected ? " on" : ""}`} points={[`${X(0)},${Y(0)}`, ...s.points.map((value, i) => `${X(i)},${Y(value)}`)].join(" ")} />
              {s.points.map((value, i) => <circle key={i} className={`pt ${k}`} cx={X(i)} cy={Y(value)} r={k === "grey" ? 2 : 3.5} />)}
            </g>
          );
        })}
        {labels.map((it) => <text key={it.id} className="lab" x={W - R + 8} y={it.y + 4}>{labelOf(it.id)}</text>)}
        <g className="ax">
          {niceTicks(lo, hi, 4).map((t) => <text key={t} x={L - 6} y={Y(t) + 4} textAnchor="end">{money(cur, t, 0, true)}</text>)}
          {dates.map((date, i) => <text key={date} x={X(i)} y={H - 8} textAnchor="middle">{fmtDate(date, false)}</text>)}
        </g>
        {at !== null ? <g className="hover"><line x1={X(at)} x2={X(at)} y1={T} y2={H - B} /></g> : null}
        <rect className="hit" x={L} y={T} width={W - L - R} height={H - T - B} onPointerMove={onMove} onPointerLeave={() => setAt(null)} />
      </svg>
      <div className={`ctip${at !== null ? " on" : ""}`} role="status" aria-live="polite"
        style={at !== null ? { left: Math.max(0, Math.min(W - 270, X(at) > W * 0.55 ? X(at) - 270 : X(at) + 12)), top: 8 } : undefined}>
        {at !== null ? (
          <>
            <b>{`Through ${fmtDateYear(dates[at])}`}</b>
            {series.slice().sort((a, b) => b.points[at] - a.points[at]).slice(0, 8).map((s) => (
              <span key={s.id}><br /><i className={klass(s.id)} />{`${nameOf(s.id)}: ${money(cur, s.points[at], d, true)}`}</span>
            ))}
            {series.length > 8 ? <><br />{`… ${series.length - 8} more`}</> : null}
          </>
        ) : null}
      </div>
      <div className="cleg">
        {coloured.map((id) => <span key={id}><i className={klass(id)} />{nameOf(id)}</span>)}
        {others > 0 ? <span><i className="grey" />{`${others} other ${v.view === "accuracy" ? (others === 1 ? "strategy" : "strategies") : (others === 1 ? "line" : "lines")} (hover to read)`}</span> : null}
        <span className="muted">dotted line = zero</span>
      </div>
    </div>
  );
}
