"use client";
// Keyboard and pointer behaviour of the frame (story W8; 30-shell "Keyboard"): / and Ctrl K search, ? lists the
// shortcuts, Esc closes the topmost overlay, g then h / p / o / s jumps, B and S on a focused row open the order
// window (refused with the lock's reason while the market is closed). Hovering a ticker shows its hover card where the
// device hovers. Every shortcut also has a button.
import { useEffect, useRef } from "react";
import { tradable } from "../../lib/shell/market.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";

const JUMP: Record<string, string> = { h: "dashboard", p: "portfolios", o: "orders", s: "screener" };
const HOVER_OPEN_MS = 350;
const HOVER_CLOSE_MS = 300;
const G_WINDOW_MS = 1200;

export function useShortcuts() {
  const ui = useFrame();
  const latest = useRef(ui);
  latest.current = ui;
  useEffect(() => {
    let gAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onKey = (e: KeyboardEvent) => {
      const f = latest.current;
      const typing = e.target instanceof Element && e.target.closest("input, textarea, select");
      if (e.key === "Escape") return f.closeTop();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); return f.openPalette(""); }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); return f.openPalette(""); }
      if (e.key === "?") { e.preventDefault(); return f.setKeysOpen(true); }
      if (gAt && Date.now() - gAt < G_WINDOW_MS) {
        gAt = 0;
        if (JUMP[e.key]) { e.preventDefault(); f.go(JUMP[e.key]); }
        return;
      }
      if (e.key === "g") { gAt = Date.now(); return; }
      if (e.key === "b" || e.key === "s") {
        const row = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-inst]") : null;
        const it = row?.dataset.inst ? f.item(row.dataset.inst) : undefined;
        if (!it || !tradable(it.kind)) return;
        e.preventDefault();
        if (f.lock) return f.snack(f.lock);
        f.openOrder(it.id, e.key === "b" ? "buy" : "sell");
      }
    };
    const anchorOf = (e: Event) => (e.target instanceof Element ? e.target.closest<HTMLElement>("a[data-inst]") : null);
    const onOver = (e: PointerEvent) => {
      const a = anchorOf(e);
      if (!a || !window.matchMedia("(hover: hover)").matches) return;
      clearTimeout(timer);
      timer = setTimeout(() => latest.current.openHover(a.dataset.inst ?? "", a), HOVER_OPEN_MS);
    };
    const onOut = (e: PointerEvent) => {
      const a = anchorOf(e);
      if (!a) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!document.getElementById("hcard")?.matches(":hover") && !a.closest(".mb-wl")) latest.current.closeHover();
      }, HOVER_CLOSE_MS);
    };
    const onClick = (e: MouseEvent) => {
      if (latest.current.hover && e.target instanceof Element && !e.target.closest(".mb-hcard, [data-inst]")) latest.current.closeHover();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("click", onClick);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("click", onClick);
    };
  }, []);
}

const KEYS: [string[], string][] = [
  [["/"], "Search everything (also Ctrl K)"],
  [["B"], "Buy the focused row"],
  [["S"], "Sell the focused row"],
  [["Esc"], "Close the drawer, card or dialog"],
  [["g", "h"], "Dashboard"],
  [["g", "p"], "Portfolio: paper portfolios"],
  [["g", "o"], "Orders"],
  [["g", "s"], "Screener"],
  [["?"], "This list"],
];

export function KeysDialog() {
  const { keysOpen, setKeysOpen } = useFrame();
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (keysOpen) close.current?.focus();
  }, [keysOpen]);
  return (
    <div className={`mb-modal${keysOpen ? " on" : ""}`} id="keys" role="dialog" aria-modal="true" aria-labelledby="keys-title">
      <div className="mb-modal-head">
        <Icon name="keyboard" />
        <h2 id="keys-title">Keyboard shortcuts</h2>
        <button ref={close} className="md-icon-btn small" type="button" aria-label="Close" onClick={() => setKeysOpen(false)}>
          <Icon name="close" />
        </button>
      </div>
      <div className="mb-modal-body">
        <dl className="mb-keys">
          {KEYS.map(([keys, what]) => (
            <div key={what} style={{ display: "contents" }}>
              <dt>{keys.map((k) => <span key={k} className="mb-kbd">{k}</span>)}</dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mb-modal-foot">
        <span>Every action also has a button: the keyboard is a shortcut, never the only way.</span>
      </div>
    </div>
  );
}
