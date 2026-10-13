"use client";
// The hover card (story W8; 30-shell "Hover card, quick view"): price, change, as-of, bid / ask and IV for snapshot
// options, the paper position held, and Chart, Chain (India F&O only), Buy and Sell. The same body is the quick view's
// lower half. Positioned beside its anchor, never off screen.
import { useLayoutEffect, useRef } from "react";
import type { Instrument } from "../../lib/shell/contract.ts";
import { isFno, tradable } from "../../lib/shell/market.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";
import { AsOfStamp, Delta } from "./parts.tsx";
import { TradePair } from "./trade.tsx";

/** Where a box goes beside (or below) its anchor, kept 8 px inside the viewport. */
export function place(box: HTMLElement, anchor: HTMLElement, side: "right" | "below") {
  const r = anchor.getBoundingClientRect();
  const w = box.offsetWidth;
  const h = box.offsetHeight;
  let x = side === "right" ? r.right + 8 : r.left;
  let y = side === "right" ? r.top : r.bottom + 6;
  if (side === "right" && x + w > innerWidth - 8) x = r.left - w - 8;
  if (x < 8 || x + w > innerWidth - 8) {
    x = Math.max(8, Math.min(innerWidth - w - 8, r.left));
    y = r.bottom + 6;
  }
  if (y + h > innerHeight - 8) y = Math.max(8, (side === "right" ? r.bottom : r.top - 6) - h);
  box.style.left = `${x}px`;
  box.style.top = `${y}px`;
}

/** Quotes, position and actions of an instrument (hover card and quick view). */
export function InstrumentBody({ it }: { it: Instrument }) {
  const { shell, fmt, go } = useFrame();
  const held = it.held;
  const account = held ? shell.accounts[held.account] : undefined;
  const pnl = held && it.last !== null ? (it.last - held.avg) * held.qty : null;
  return (
    <>
      <div className="mb-frame-row">
        <AsOfStamp item={it} />
        {it.bid != null && it.ask != null ? <span className="mb-asof" data-tip="Best bid and ask of the 3 pm snapshot: no market depth is recorded.">{`bid ${fmt.price(it.bid)} · ask ${fmt.price(it.ask)}`}</span> : null}
        {it.iv != null ? <span className="mb-asof" data-tip="Implied volatility computed by us from the snapshot (labelled, not exchange data).">{`IV ${it.iv.toFixed(1)}% (ours)`}</span> : null}
      </div>
      {held && account ? (
        <div className="held">
          <b>{`${held.qty > 0 ? "Long" : "Short"} ${Math.abs(held.qty)}`}</b>
          {` at ${fmt.price(held.avg)} · ${account.name}${held.structure ? " · " + held.structure : ""} · `}
          <span className={`mb-delta ${pnl && pnl > 0 ? "up" : pnl && pnl < 0 ? "down" : "flat"}`}>{fmt.money(pnl, undefined, true)}</span>
        </div>
      ) : (
        <div className="held">No paper position in this market.</div>
      )}
      <div className="acts">
        <button className="md-btn outlined small" type="button" onClick={() => go("chart")}>
          <Icon name="show_chart" />
          Chart
        </button>
        {shell.fno && (it.fno || isFno(it.kind)) ? (
          <button className="md-btn outlined small" type="button" onClick={() => go("chain")}>
            <Icon name="layers" />
            Chain
          </button>
        ) : null}
        {tradable(it.kind) ? <TradePair id={it.id} className="mb-bs-pair" /> : <span className="muted">Indices are not traded; use their futures or options.</span>}
      </div>
    </>
  );
}

export function HoverCard() {
  const { hover, item, fmt, closeHover } = useFrame();
  const box = useRef<HTMLDivElement>(null);
  const it = hover ? item(hover.id) : undefined;
  useLayoutEffect(() => {
    if (hover && box.current) place(box.current, hover.anchor, hover.anchor.closest(".mb-wl") ? "right" : "below");
  }, [hover]);
  return (
    <div ref={box} className={`mb-hcard${it ? " on" : ""}`} id="hcard" role="dialog" aria-label="Quick view" onPointerLeave={() => { if (hover && !hover.anchor.closest(".mb-wl")) closeHover(); }}>
      {it ? (
        <>
          <div className="top">
            <div>
              <b>{it.sym}</b>
              <small>{it.name}</small>
            </div>
            <div className="px">
              {fmt.price(it.last)}
              <Delta value={it.chg_pct} />
            </div>
          </div>
          <InstrumentBody it={it} />
        </>
      ) : null}
    </div>
  );
}
