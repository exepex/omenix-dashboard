"use client";
// The company page's forecast history (owner, 2026-10-10; B12's rm.stock `forecast_history`): for the selected
// horizon, every stored ranges.py run and signal-model run of the last 10 as-of dates. Above, a chart over the runs'
// times: the 80% and 50% ranges as bands, the target and the base close (the price the run started from), then P(up)
// against the 50% line. Below, one line per run, newest first: what changed since the run before (never how the
// numbers were made: owner, 13 Oct 2026). Every point is focusable and reads its run. Logic: lib/company-pages/history-logic.ts.
import { useMemo } from "react";
import { HorizonTabs } from "../../../../../../components/ui/controls.tsx";
import { Card, CardHead } from "../../../../../../components/ui/primitives.tsx";
import { fmtDate, holdLabel, offsetMinutes, pct, price, signed } from "../../../../../../lib/ui/format.ts";
import {
  hasEvening, historyAt, historyEntries, historyGeometry, isEvening, rangeChangeWords, runName, scoreChangeWords, type HistoryEntry,
} from "../../../../../../lib/company-pages/history-logic.ts";
import type { CompanyPayload, HistoryRange, HistoryScore } from "../../../../../../lib/company-pages/types.ts";
import type { PageCtx } from "./context.ts";
import { useWidth } from "../../../../../../lib/ui/use-width.ts";

const SHOWN = 6;

function RunLine({ e, ctx, anyEvening }: { e: HistoryEntry; ctx: PageCtx; anyEvening: boolean }) {
  const cur = ctx.currency;
  const run = runName(e.row, anyEvening);
  const head = e.kind === "range"
    ? `Range · target ${price(cur, e.row.target_price)}, 80% ${price(cur, e.row.lo80)}–${price(cur, e.row.hi80)}`
    : `Score · chance of a rise ${pct(e.row.prob_up, 1)}`;
  const words = e.kind === "range" ? rangeChangeWords(e) : scoreChangeWords(e);
  return (
    <li className={"fh-run " + e.kind + (isEvening(e.row) ? " eve" : "")}>
      <span className="fh-when">{ctx.at(e.at, true)}<small>as of the {fmtDate(e.row.as_of_date, false)} close</small></span>
      <div className="fh-what">
        <b>{run ? <span className="fh-tag" data-tip={isEvening(e.row) ? "Evening run on the day’s close: a preview, never traded; the pre-open run replaces it." : "Pre-open run: the forecast of record, made before the open."}>{run}</span> : null}{head}</b>
        <span className="fh-chg">{words.join(" · ")}</span>
      </div>
    </li>
  );
}

export function ForecastHistoryCard({ p, ctx, horizon, onHorizon }: { p: CompanyPayload; ctx: PageCtx; horizon: number; onHorizon: (k: number) => void }) {
  const cur = ctx.currency;
  const [hostRef, width] = useWidth<HTMLDivElement>();
  const { ranges, scores } = useMemo(() => historyAt(p.forecast_history, horizon), [p.forecast_history, horizon]);
  const entries = useMemo(() => historyEntries(ranges, scores), [ranges, scores]);
  const anyEvening = hasEvening(ranges, scores);
  const g = useMemo(() => historyGeometry(ranges, scores, width ?? 0, offsetMinutes(p.status.session.local_time)), [ranges, scores, width, p.status.session.local_time]);
  const head = (
    <CardHead
      title="Forecast history: how each run changed"
      help="Every stored run of the last 10 as-of dates for the selected holding period: the likely price range (the target, the 50% and 80% ranges and the close it started from) and the statistical model’s chance of a rise. Each line says what changed since the run before. A range or score run again for the same close is a revision. History only: it says how the forecast moved, not whether it was right."
      end={<HorizonTabs horizons={p.horizons} value={horizon} onChange={onHorizon} />}
    />
  );
  if (!p.forecast_history) {
    return <Card label="Forecast history">{head}<div className="quiet">No forecast history in this page yet; it arrives with the next morning run.</div></Card>;
  }
  if (!entries.length) {
    return <Card label="Forecast history">{head}<div className="quiet">No range or score run stored for this company for a {holdLabel(horizon)} in the last 10 as-of dates.</div></Card>;
  }
  const recent = entries.slice(0, SHOWN), earlier = entries.slice(SHOWN);
  let chart = null;
  if (g) {
    const { W, H, L, R, T, PH, QT, QH } = g;
    const right = W - R;
    chart = (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
        aria-label={`${p.company.name}, ${holdLabel(horizon)}: ${ranges.length} range ${ranges.length === 1 ? "run" : "runs"} and ${scores.length} score ${scores.length === 1 ? "run" : "runs"} over the last 10 as-of dates. Tab to each point to read its run; the list below says the same.`}>
        {PH ? (
          <g className="fh-price">
            <g className="grid">{g.priceTicks.map((v) => <line key={v} x1={L} x2={right} y1={g.py(v)} y2={g.py(v)} />)}</g>
            {g.band80 ? <polygon className="b80" points={g.band80} /> : null}
            {g.band50 ? <polygon className="b50" points={g.band50} /> : null}
            <polyline className="base" points={g.base.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ")} />
            <polyline className="tl" points={g.target.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ")} />
            {ranges.map((r, i) => (
              <g key={`${r.id}@${r.made_at}`}>
                <rect className="bs" x={g.base[i].x - 3} y={g.base[i].y - 3} width={6} height={6} />
                <circle className={"tg" + (isEvening(r) ? " eve" : "")} cx={g.target[i].x} cy={g.target[i].y} r={4} tabIndex={0} role="img"
                  aria-label={`${runName(r, anyEvening) ? runName(r, anyEvening) + " " : ""}Range run ${ctx.at(r.made_at, true)}: target ${price(cur, r.target_price)}, 50% ${price(cur, r.lo50)}–${price(cur, r.hi50)}, 80% ${price(cur, r.lo80)}–${price(cur, r.hi80)}, from the close ${price(cur, r.base_close)}.`}
                  data-tip={`${ctx.at(r.made_at, true)}${runName(r, anyEvening) ? ` · ${runName(r, anyEvening)}` : ""} · target ${price(cur, r.target_price)} · 80% ${price(cur, r.lo80)}–${price(cur, r.hi80)} · close ${price(cur, r.base_close)}${r.change?.target_pct != null ? ` · target ${signed(r.change.target_pct)}` : ""}`} />
              </g>
            ))}
            <g className="ax">
              {g.priceTicks.map((v) => <text key={v} x={right + 6} y={g.py(v) + 4}>{price(cur, v)}</text>)}
              <text className="ttl" x={L} y={T + 10}>Price</text>
            </g>
          </g>
        ) : null}
        {QH ? (
          <g className="fh-prob">
            <g className="grid">{g.probTicks.map((v) => <line key={v} x1={L} x2={right} y1={g.qy(v)} y2={g.qy(v)} />)}</g>
            <line className="half" x1={L} x2={right} y1={g.half} y2={g.half} />
            <polyline className="pl" points={g.prob.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ")} />
            {scores.filter((s) => s.prob_up != null).map((s, i) => (
              <circle key={`${s.id}@${s.computed_at}`} className={"pp" + (isEvening(s) ? " eve" : "")} cx={g.prob[i].x} cy={g.prob[i].y} r={3.5} tabIndex={0} role="img"
                aria-label={`${runName(s, anyEvening) ? runName(s, anyEvening) + " " : ""}Score run ${ctx.at(s.computed_at, true)}: chance of a rise ${pct(s.prob_up, 1)}${s.change?.prob_up != null ? `, ${signed(s.change.prob_up * 100, 1, " points")}` : ""}.`}
                data-tip={`${ctx.at(s.computed_at, true)}${runName(s, anyEvening) ? ` · ${runName(s, anyEvening)}` : ""} · chance of a rise ${pct(s.prob_up, 1)}${s.change?.prob_up != null ? ` (${signed(s.change.prob_up * 100, 1, " points")})` : ""} · ${s.news_items ?? 0} news`} />
            ))}
            <g className="ax">
              {g.probTicks.map((v) => <text key={v} x={right + 6} y={g.qy(v) + 4}>{pct(v)}</text>)}
              <text className="ttl" x={L} y={QT + 10}>Chance of a rise</text>
            </g>
          </g>
        ) : null}
        <g className="ax">{g.days.map((d) => <text key={d.label} x={d.x} y={H - 6} textAnchor="middle">{d.label}</text>)}</g>
      </svg>
    );
  }
  return (
    <Card label="Forecast history">
      {head}
      <div className="chart fh-chart" ref={hostRef}>{chart}</div>
      <div className="chleg" aria-label="Forecast history legend">
        {ranges.length ? (
          <>
            <span><i className="b8" />80% range</span>
            <span><i className="b5" />50% range</span>
            <span><i className="tg" />target</span>
            <span><i className="fh-bs" />close the run started from</span>
          </>
        ) : <span className="muted">No range run for a {holdLabel(horizon)} in the window.</span>}
        {anyEvening ? <span><i className="fh-eve" />hollow = evening run (on the day’s close, never traded)</span> : null}
        {scores.length ? <span><i className="fh-pp" />chance of a rise, dashed line = 50% (coin flip)</span> : <span className="muted">No score run for a {holdLabel(horizon)} in the window.</span>}
      </div>
      <ol className="fh-runs" aria-label={`Runs for a ${holdLabel(horizon)}, newest first`}>
        {recent.map((e) => <RunLine key={`${e.kind}:${e.row.id}@${e.at}`} e={e} ctx={ctx} anyEvening={anyEvening} />)}
      </ol>
      {earlier.length ? (
        <details className="fh-more">
          <summary>Earlier runs ({earlier.length})</summary>
          <ol className="fh-runs">{earlier.map((e) => <RunLine key={`${e.kind}:${e.row.id}@${e.at}`} e={e} ctx={ctx} anyEvening={anyEvening} />)}</ol>
        </details>
      ) : null}
    </Card>
  );
}
