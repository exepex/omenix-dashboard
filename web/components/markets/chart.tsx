"use client";
// The Markets overview's line charts (story W12; 34-markets' `line` and `spark`): a series of closes, green when it
// ended up, red when down, neutral for a volatility series (where up is not good). Empty values are skipped. The big
// charts zoom, pan and read each session with the crosshair (the shared chart zoom, W14); the sparks stay small marks.
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useWidth } from "../../lib/ui/use-width.ts";
import { Crosshair, ZoomBar, useChartZoom } from "../charts/zoom.tsx";

type Point = readonly [number, number];

/** The known points of a window of closes, as [index in the window, close]. */
const known = (vals: readonly (number | null)[]): Point[] => vals.map((v, i) => [i, v] as const).filter((p): p is Point => p[1] !== null);

const stroke = (pts: Point[], neutral: boolean) => (neutral ? "var(--mb-chart-1)" : pts[pts.length - 1][1] >= pts[0][1] ? "var(--mb-color-up)" : "var(--mb-color-down)");

/** A spark: the period's closes as a small stretched line beside an index. */
export function Spark({ vals, neutral }: { vals: (number | null)[]; neutral: boolean }) {
  const W = 600, H = 28, pts = known(vals);
  if (!pts.length) return null;
  const lo = Math.min(...pts.map((p) => p[1])), hi = Math.max(...pts.map((p) => p[1]));
  const xy = ([i, v]: Point) => `${((i / Math.max(1, vals.length - 1)) * W).toFixed(1)},${(H - 6 - ((v - lo) / (hi - lo || 1)) * (H - 12)).toFixed(1)}`;
  return (
    <span style={{ display: "inline-block", width: 90 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="trend" className="spark" style={{ height: H }}>
        <polyline points={pts.map(xy).join(" ")} fill="none" stroke={stroke(pts, neutral)} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

const ago = (k: number) => (k === 0 ? "today" : `${k} ${k === 1 ? "session" : "sessions"} ago`);
const PAD_R = 64, PAD_B = 22, PAD_T = 6;

/** A period's closes drawn at the card's width, with zoom, pan and the crosshair; `middle` sits between the axis ends. */
export function ZoomLine({ vals, label, locale, height = 160, neutral = false, middle }: { vals: (number | null)[]; label: string; locale: string; height?: number; neutral?: boolean; middle?: ReactNode }) {
  const [hostRef, width, host] = useWidth<HTMLDivElement>();
  const plotRef = useRef<SVGRectElement>(null);
  const view = useChartZoom(vals.length, host, plotRef);
  const [hover, setHover] = useState<number | null>(null);
  const { start, end } = view.win;
  const shown = useMemo(() => vals.slice(start, end), [vals, start, end]);
  const pts = known(shown);
  const n = vals.length, W = Math.max(200, width ?? 0), H = height + PAD_B, right = W - PAD_R;
  const fmt = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lo = pts.length ? Math.min(...pts.map((p) => p[1])) : 0, hi = pts.length ? Math.max(...pts.map((p) => p[1])) : 1;
  const x = (i: number) => (i / Math.max(1, shown.length - 1)) * right;
  const y = (v: number) => PAD_T + (height - 2 * PAD_T) * (1 - (v - lo) / (hi - lo || 1));
  const read = (clientX: number) => {
    const r = plotRef.current?.getBoundingClientRect();
    if (r?.width) setHover(Math.max(0, Math.min(shown.length - 1, Math.round(((clientX - r.left) / r.width) * (shown.length - 1)))));
  };
  const hv = hover !== null ? shown[hover] : null;
  const onKey = (e: React.KeyboardEvent) => {
    if (view.onKey(e)) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      setHover((h) => Math.max(0, Math.min(shown.length - 1, (h ?? shown.length - 1) + (e.key === "ArrowRight" ? 1 : -1))));
    } else if (e.key === "Escape") setHover(null);
  };
  return (
    <>
      <ZoomBar view={view} unit="sessions" />
      <div className={"chart" + (view.moving ? " panning" : "")} data-zoom ref={hostRef}>
        {width && pts.length ? (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" tabIndex={0} onKeyDown={onKey} onBlur={() => setHover(null)}
            aria-label={`${label}. ${shown.length} of ${n} sessions shown. Arrow keys read each session, plus and minus zoom, 0 resets.`}>
            <polyline points={pts.map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} fill="none" stroke={stroke(pts, neutral)} strokeWidth="2" />
            <g className="axis">
              <text x={right + 6} y={y(hi) + 4}>{fmt(hi)}</text>
              <text x={right + 6} y={y(lo) + 4}>{fmt(lo)}</text>
            </g>
            {hv !== null && hover !== null ? (
              <Crosshair x={x(hover)} y={y(hv)} top={0} bottom={height} left={0} right={right} date={ago(n - 1 - (start + hover))} value={fmt(hv)} />
            ) : null}
            <rect ref={plotRef} className="hit" x={0} y={0} width={right} height={height}
              onPointerDown={(e) => { view.gestures.onPointerDown(e); read(e.clientX); }}
              onPointerMove={(e) => (view.gestures.onPointerMove(e) ? setHover(null) : read(e.clientX))}
              onPointerUp={view.gestures.onPointerUp} onPointerCancel={view.gestures.onPointerUp}
              onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)} />
          </svg>
        ) : null}
      </div>
      <div className="axis"><span>{ago(n - 1 - start)}</span>{middle}<span>{ago(n - end)}</span></div>
    </>
  );
}
