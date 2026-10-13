"use client";
// The one search box's results (story W8; 30-shell "Search"): a modal list of stocks, indices, F&O underlyings and
// contracts (India only), strategies, news and pages; arrow keys move, Enter opens, Esc closes. Every stock and
// contract result has B and S (lib/shell/search.ts finds; trade.tsx decides the lock).
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { nothingFound, search, type SearchRow } from "../../lib/shell/search.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";
import { Delta } from "./parts.tsx";
import { TradePair } from "./trade.tsx";

function Result({ r, i, selected, onPick, onMark }: { r: SearchRow; i: number; selected: boolean; onPick: () => void; onMark: () => void }) {
  const { item, fmt, closePalette } = useFrame();
  const it = r.instrumentId ? item(r.instrumentId) : undefined;
  const tone = r.group === "Pages" ? "neutral" : r.group === "News" ? "info" : "";
  return (
    <div className="mb-pal-item" role="option" id={`pal-${i}`} aria-selected={selected} onClick={onPick} onPointerMove={onMark}>
      <span className={`mb-avatar ${tone}`}>
        <Icon name={r.icon} />
      </span>
      <span style={{ minWidth: 0 }}>
        <b>{r.label}</b>
        <small>{r.sub}</small>
      </span>
      <span className="end mb-frame-row">
        {it ? (
          <>
            {fmt.price(it.last)} <Delta value={it.chg_pct} />
            <TradePair id={it.id} variant="letter" before={closePalette} />
          </>
        ) : null}
      </span>
    </div>
  );
}

export function Palette() {
  const { shell, palette, closePalette, openDrawer, go } = useFrame();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const open = palette !== null;
  useEffect(() => {
    if (!open) return;
    setQuery(palette ?? "");
    setSel(0);
    setTimeout(() => input.current?.focus(), 0);
  }, [open, palette]);
  const rows = useMemo(() => (open ? search(shell, query) : []), [open, shell, query]);
  const pick = (r: SearchRow) => {
    closePalette();
    if (r.target.kind === "instrument") openDrawer({ kind: "quick", id: r.target.id });
    else go(r.target.screen);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(rows.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter" && rows[sel]) { e.preventDefault(); pick(rows[sel]); }
  };
  useEffect(() => document.getElementById(`pal-${sel}`)?.scrollIntoView({ block: "nearest" }), [sel]);
  return (
    <div className={`mb-modal palette${open ? " on" : ""}`} id="palette" role="dialog" aria-modal="true" aria-label="Search">
      {open ? (
        <>
          <div className="mb-modal-head">
            <Icon name="search" />
            <input
              ref={input}
              type="search"
              value={query}
              placeholder={shell.fno ? "Symbol, company or option code: reliance, nifty 24500 ce, NIFTY26OCT24500CE" : "Symbol or company: aapl, nvidia"}
              aria-label="Search"
              aria-controls="pal-list"
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => { setQuery(e.target.value); setSel(0); }}
              onKeyDown={onKey}
            />
            <button className="md-icon-btn small" type="button" aria-label="Close" onClick={closePalette}>
              <Icon name="close" />
            </button>
          </div>
          <div className="mb-modal-body" id="pal-list" role="listbox">
            {rows.map((r, i) => (
              <div key={`${r.group}:${r.label}:${i}`}>
                {i === 0 || rows[i - 1].group !== r.group ? <div className="mb-pal-group">{r.group}</div> : null}
                <Result r={r} i={i} selected={i === sel} onPick={() => pick(r)} onMark={() => setSel(i)} />
              </div>
            ))}
            {rows.length ? null : <div className="quiet" style={{ margin: 8 }}>{nothingFound(shell, query)}</div>}
          </div>
          <div className="mb-modal-foot">
            <span><span className="mb-kbd">↑</span><span className="mb-kbd">↓</span>move</span>
            <span><span className="mb-kbd">Enter</span>open</span>
            <span><span className="mb-kbd">Esc</span>close</span>
            <span>{`${shell.label} market · prices are as-of, not live`}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
