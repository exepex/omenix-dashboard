"use client";
// Zoom, pan and the crosshair of every price chart (story W14, owner's feedback of 13 Oct 2026), one implementation
// for all of them: useChartZoom keeps which points show (lib/ui/chart-view.ts); its gestures are Ctrl or ⌘ + wheel
// and a trackpad pinch (a plain wheel still scrolls the page), a two-finger pinch on a touch screen, a drag to move
// in time, and the keys + − 0 on the focused chart; <ZoomBar> gives the same as buttons (touch, keyboard, screen
// readers) and says what is shown; <Crosshair> draws the hovered or tapped point's date and price on the axes.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from "react";
import { ZOOM_STEP, canZoomIn, clampWindow, initialWindow, isWhole, panWindow, pinchFactor, wheelFactor, zoomWindow, type ChartWindow } from "../../lib/ui/chart-view.ts";
import { Icon } from "../ui/icon.tsx";

export interface ChartZoom {
  win: ChartWindow;
  n: number;
  zoom: (factor: number, at?: number) => void;
  pan: (points: number) => void;
  reset: () => void;
  /** True while a drag or pinch moves the chart (the hover read-out waits). */
  moving: boolean;
  /** Pointer handlers for the plot's hit area; `fraction` maps a clientX to 0..1 of the plot's width. */
  gestures: {
    onPointerDown: (e: PointerEvent<Element>) => void;
    onPointerMove: (e: PointerEvent<Element>) => boolean;
    onPointerUp: (e: PointerEvent<Element>) => void;
  };
  onKey: (e: KeyboardEvent) => boolean;
}

/** The window over `n` points (opening on the last `initial`), with its gestures. `plot` is the hit area whose width
 *  is the drawn window; the wheel listener sits on `host` (React's wheel handler cannot stop the page scroll). */
export function useChartZoom(n: number, host: RefObject<HTMLElement | null>, plot: RefObject<Element | null>, initial?: number): ChartZoom {
  const [win, setWin] = useState<ChartWindow>(() => initialWindow(n, initial));
  const [moving, setMoving] = useState(false);
  const pointers = useRef(new Map<number, number>());
  // The gesture's start: where the pointers were and the window then (each move is measured from it, so no drift).
  const start = useRef<{ x: number; gap: number; win: ChartWindow } | null>(null);
  useEffect(() => setWin(initialWindow(n, initial)), [n, initial]);
  const fraction = (clientX: number) => {
    const r = plot.current?.getBoundingClientRect();
    return r && r.width ? (clientX - r.left) / r.width : 0.5;
  };
  const zoom = (factor: number, at = 1) => setWin((w) => zoomWindow(w, n, factor, at));
  const pan = (points: number) => setWin((w) => panWindow(w, n, points));
  const reset = () => setWin(initialWindow(n, initial));
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // a plain wheel scrolls the page
      e.preventDefault();
      const at = fraction(e.clientX);
      setWin((w) => zoomWindow(w, n, wheelFactor(e.deltaY), Math.max(0, Math.min(1, at))));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  });
  const begin = (w: ChartWindow) => {
    const xs = [...pointers.current.values()];
    start.current = { x: xs.reduce((sum, v) => sum + v, 0) / xs.length, gap: xs.length > 1 ? Math.abs(xs[0] - xs[1]) : 0, win: w };
  };
  const gestures = {
    onPointerDown: (e: PointerEvent<Element>) => {
      pointers.current.set(e.pointerId, e.clientX);
      begin(win);
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    /** Returns true when the move is a drag or a pinch (the caller then skips its hover read-out). */
    onPointerMove: (e: PointerEvent<Element>) => {
      const from = start.current, r = plot.current?.getBoundingClientRect();
      if (!pointers.current.has(e.pointerId) || !from || !r?.width) return false;
      pointers.current.set(e.pointerId, e.clientX);
      const xs = [...pointers.current.values()];
      if (xs.length > 1 && from.gap > 0) {
        const mid = (xs[0] + xs[1]) / 2;
        setWin(zoomWindow(from.win, n, pinchFactor(from.gap, Math.abs(xs[0] - xs[1])), (mid - r.left) / r.width));
      } else {
        const dx = e.clientX - from.x;
        if (Math.abs(dx) < 4 && !moving) return false; // a tap or a still finger reads the point instead
        setWin(panWindow(from.win, n, Math.round((-dx / r.width) * (from.win.end - from.win.start))));
      }
      setMoving(true);
      return true;
    },
    onPointerUp: (e: PointerEvent<Element>) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size) begin(win);
      else {
        start.current = null;
        setMoving(false);
      }
    },
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "+" || e.key === "=") zoom(ZOOM_STEP);
    else if (e.key === "-" || e.key === "_") zoom(1 / ZOOM_STEP);
    else if (e.key === "0") reset();
    else return false;
    e.preventDefault();
    return true;
  };
  return { win: clampWindow(win, n), n, zoom, pan, reset, moving, gestures, onKey };
}

/** Zoom in, zoom out, reset, and what is shown ("Showing 30 of 120 sessions"). */
export function ZoomBar({ view, unit, children }: { view: ChartZoom; unit: string; children?: ReactNode }) {
  const { win, n } = view;
  const whole = isWhole(win, n);
  const shown = win.end - win.start;
  return (
    <div className="mb-zoom" role="group" aria-label="Chart zoom">
      <button type="button" className="md-icon-btn" aria-label="Zoom in" data-tip="Zoom in (or Ctrl + scroll, pinch, the + key)" disabled={!canZoomIn(win, n)} onClick={() => view.zoom(ZOOM_STEP)}>
        <Icon name="zoom_in" />
      </button>
      <button type="button" className="md-icon-btn" aria-label="Zoom out" data-tip="Zoom out (or Ctrl + scroll, pinch, the − key)" disabled={whole} onClick={() => view.zoom(1 / ZOOM_STEP)}>
        <Icon name="zoom_out" />
      </button>
      <button type="button" className="md-icon-btn" aria-label="Reset the zoom" data-tip="Back to the first view (the 0 key)" onClick={view.reset}>
        <Icon name="restart_alt" />
      </button>
      <span className="mb-zoom-span" aria-live="polite">{`Showing ${shown} of ${n} ${unit}${whole ? "" : " · drag to move"}`}</span>
      {children}
    </div>
  );
}

/** The crosshair at (x, y) inside a plot [left, right] × [top, bottom], with the date tag on the time axis and the
 *  price tag on the price axis (right of `right`). Tags are measured roughly: 6.6 px per character at 11 px. */
export function Crosshair({ x, y, top, bottom, left, right, date, value }: { x: number; y: number; top: number; bottom: number; left: number; right: number; date: string; value: string }) {
  const dw = date.length * 6.6 + 12, vw = value.length * 6.6 + 12;
  const dx = Math.max(left, Math.min(right - dw, x - dw / 2));
  return (
    <g className="mb-xhair" aria-hidden="true" pointerEvents="none">
      <line x1={x} x2={x} y1={top} y2={bottom} />
      <line x1={left} x2={right} y1={y} y2={y} />
      <rect x={dx} y={bottom + 2} width={dw} height={17} rx={3} />
      <text x={dx + dw / 2} y={bottom + 14} textAnchor="middle">{date}</text>
      <rect x={right + 2} y={y - 9} width={vw} height={18} rx={3} />
      <text x={right + 2 + vw / 2} y={y + 4} textAnchor="middle">{value}</text>
    </g>
  );
}
