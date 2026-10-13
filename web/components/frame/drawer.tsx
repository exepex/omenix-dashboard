"use client";
// The right drawer (story W8; 30-shell "Right drawer and bottom sheet"): the order window, an instrument's quick view,
// or every screen (the phone's More). From the right on desktop, a bottom sheet on a phone; Esc or the veil closes it
// and focus returns where it was.
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useChatPanel } from "../shell/chat-panel.tsx";
import type { Instrument } from "../../lib/shell/contract.ts";
import { navGroups, screenHref } from "../../lib/shell/nav.ts";
import { signed } from "../../lib/ui/format.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";
import { InstrumentBody } from "./hover-card.tsx";
import { OrderWindow } from "./order-window.tsx";
import { AsOfStamp, Delta, DrawerHead, ExampleTag } from "./parts.tsx";

function Spark({ it }: { it: Instrument }) {
  const v = it.spark;
  if (!v || v.length < 2) return null;
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const W = 360;
  const H = 90;
  const line = v.map((y, i) => `${i ? "L" : "M"}${((i / (v.length - 1)) * W).toFixed(1)},${(H - 6 - ((y - lo) / (hi - lo || 1)) * (H - 12)).toFixed(1)}`).join("");
  const gid = `g${it.id.replace(/\W/g, "")}`;
  return (
    <svg className="mb-frame-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${it.sym}: the last ${v.length} daily closes, ${signed(it.chg_pct)} today`}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--mb-chart-1)" stopOpacity=".28" />
          <stop offset="1" stopColor="var(--mb-chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${W},${H}L0,${H}Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="var(--mb-chart-1)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function QuickView({ it }: { it: Instrument }) {
  const { fmt } = useFrame();
  return (
    <>
      <DrawerHead title={it.sym} sub={it.name}>
        <div className="mb-frame-row" style={{ marginTop: 6 }}>
          <AsOfStamp item={it} />
          <ExampleTag />
        </div>
      </DrawerHead>
      <div className="mb-drawer-body">
        <div className="mb-frame-quote">
          <b>{fmt.price(it.last)}</b>
          <Delta value={it.chg_pct} />
          <span className="muted">change on the previous close</span>
        </div>
        {it.spark ? <Spark it={it} /> : <div className="quiet">{it.kind === "option" ? "Options have one recorded price a day (the 3 pm snapshot); the chain shows the strike around it." : "End-of-day prices only for this contract."}</div>}
        <InstrumentBody it={it} />
      </div>
      <div className="mb-drawer-foot">
        <div className="muted">Quick view. The full page has the chart, signals, news, events and your positions.</div>
      </div>
    </>
  );
}

/** Ask the assistant from the phone's More (the app bar has the same button from 600 px). */
function AskItem() {
  const { closeDrawer } = useFrame();
  const chat = useChatPanel();
  if (!chat.available) return null;
  return (
    <button className="mb-pal-item" type="button" aria-controls="mb-chat-slot" aria-expanded={chat.open} onClick={() => { closeDrawer(false); chat.setOpen(true); }}>
      <span className="mb-avatar neutral"><Icon name="smart_toy" /></span>
      <span><b>Ask the assistant</b><small>chat panel on this page</small></span>
      <span className="end"><Icon name="chevron_right" /></span>
    </button>
  );
}

function AllScreens() {
  const { shell, market, closeDrawer, go } = useFrame();
  return (
    <>
      <DrawerHead title="All screens" sub={`${shell.label} market${shell.fno ? "" : " · F&O is India only"}`} />
      <div className="mb-drawer-body">
        {navGroups(shell.fno).map((g) =>
          g ? (
            <div key={g.id}>
              <div className="mb-pal-group" style={{ paddingLeft: 0 }}>{g.label}</div>
              {g.id === "assistant" ? <AskItem /> : null}
              {g.items.map((s) => {
                const href = screenHref(market, s);
                const body = (
                  <>
                    <span className="mb-avatar neutral"><Icon name={s.icon} /></span>
                    <span><b>{s.label}</b><small>{href || s.action ? s.key ?? "open" : "not built yet"}</small></span>
                    <span className="end"><Icon name="chevron_right" /></span>
                  </>
                );
                return href ? (
                  <Link key={s.id} className="mb-pal-item" href={href} onClick={closeDrawer}>{body}</Link>
                ) : (
                  <a key={s.id} className="mb-pal-item" href="#" onClick={(e) => { e.preventDefault(); closeDrawer(); go(s); }}>{body}</a>
                );
              })}
            </div>
          ) : null,
        )}
      </div>
    </>
  );
}

export function Drawer() {
  const { drawer, item } = useFrame();
  const box = useRef<HTMLElement>(null);
  const it = drawer && drawer.kind !== "nav" ? item(drawer.id) : undefined;
  const body = !drawer ? null : drawer.kind === "nav" ? <AllScreens /> : !it ? null : drawer.kind === "quick" ? <QuickView it={it} /> : <OrderWindow key={`${it.id}:${drawer.side}`} it={it} side={drawer.side} />;
  useEffect(() => {
    if (body) setTimeout(() => box.current?.querySelector<HTMLElement>(".mb-drawer-head .md-icon-btn")?.focus(), 0);
  }, [drawer, body === null]);
  return (
    <aside ref={box} className={`mb-drawer${body ? " open" : ""}`} id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="mb-sheet-grip" aria-hidden="true" />
      {body}
    </aside>
  );
}
