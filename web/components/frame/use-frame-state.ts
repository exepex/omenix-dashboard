"use client";
// The frame's state machine (story W8): overlays, panel, density and rail choices, and the clock and lock derived from
// the frame data. The URL hash opens a state directly, as the signed-off mockup's links do (#drawer=order:RELIANCE:buy,
// #pal=NIFTY26OCT22800CE, #keys=1, #picks=1, #ap=rule, and #clock=open for the labelled example clock of example data).
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FrameData, Instrument } from "../../lib/shell/contract.ts";
import { frameClock, marketState, tradeLock } from "../../lib/shell/market.ts";
import { SOON, screenById, screenHref, type NavScreen } from "../../lib/shell/nav.ts";
import { money, moneyDecimals, price } from "../../lib/ui/format.ts";
import type { Approach, Density, DrawerView, FrameUi, MenuView, RailMode } from "./frame-context.tsx";

const SNACK_MS = 5000;

function parseDrawer(value: string | null): DrawerView | null {
  const [kind, id, side] = (value ?? "").split(":");
  if (kind === "order" && id) return { kind, id, side: side === "sell" ? "sell" : "buy" };
  if (kind === "quick" && id) return { kind, id };
  return kind === "nav" ? { kind } : null;
}

export function useFrameState(data: FrameData): FrameUi & { snackText: string | null; dismissSnack: () => void } {
  const router = useRouter();
  const { shell, market } = data;
  const [exampleClock, setExampleClock] = useState(false);
  const [drawer, setDrawer] = useState<DrawerView | null>(null);
  const [palette, setPalette] = useState<string | null>(null);
  const [keysOpen, setKeysOpen] = useState(false);
  const [hover, setHover] = useState<FrameUi["hover"]>(null);
  const [menu, setMenu] = useState<MenuView | null>(null);
  const [picksOpen, setPicksOpen] = useState(false);
  const [picksOff, setPicksOff] = useState(false);
  const [approach, setApproach] = useState<Approach>("all");
  const [density, setDensity] = useState<Density>("comfortable");
  const [rail, setRail] = useState<RailMode>("labels");
  const [snackText, setSnackText] = useState<string | null>(null);
  // Instruments a page lends the frame from its own blocks (the Screener's followed companies at their close), so the
  // order window and quick view work for them as for the shell's own.
  const [pageItems, setPageItems] = useState<Record<string, Instrument>>({});
  const addItems = useCallback((items: Record<string, Instrument>) => setPageItems((had) => ({ ...had, ...items })), []);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const nowMs = frameClock(shell, data.now, data.example, exampleClock);
  const status = useMemo(() => marketState(shell, nowMs), [shell, nowMs]);
  const lock = tradeLock(status);
  const fmt = useMemo(
    () => ({
      money: (x: number | null | undefined, decimals?: number, sign = false) => money(shell.currency, x, decimals ?? moneyDecimals(shell.currency), sign),
      price: (x: number | null | undefined) => price(shell.currency, x),
    }),
    [shell.currency],
  );

  const remember = () => {
    if (document.activeElement instanceof HTMLElement && !document.activeElement.closest(".mb-drawer, .mb-modal")) lastFocus.current = document.activeElement;
  };
  const restoreFocus = () => setTimeout(() => lastFocus.current?.focus?.(), 0);
  const snack = useCallback((message: string) => {
    setSnackText(message);
    if (snackTimer.current) clearTimeout(snackTimer.current);
    snackTimer.current = setTimeout(() => setSnackText(null), SNACK_MS);
  }, []);
  const openDrawer = useCallback((view: DrawerView) => {
    remember();
    setHover(null);
    setMenu(null);
    setPalette(null);
    setDrawer(view);
  }, []);
  const closeDrawer = useCallback((restore: unknown = true) => {
    setDrawer(null);
    if (restore !== false) restoreFocus();
  }, []);
  const openPalette = useCallback((query = "") => {
    remember();
    setHover(null);
    setMenu(null);
    setPalette(query);
  }, []);
  const closePalette = useCallback(() => {
    setPalette(null);
    restoreFocus();
  }, []);
  const openOrder = useCallback((id: string, side: "buy" | "sell") => openDrawer({ kind: "order", id, side }), [openDrawer]);

  const go = useCallback(
    (target: NavScreen | string) => {
      const s = typeof target === "string" ? screenById(shell.fno, target) : target;
      if (!s) return snack("This screen is India only: it is absent in the US market.");
      if (s.action === "order") return openOrder(shell.signals[0]?.id ?? Object.keys(shell.items)[0], "buy");
      if (s.action === "keys") return setKeysOpen(true);
      const href = screenHref(market, s);
      if (href) router.push(href);
      else snack(`${s.label}: ${SOON}`);
    },
    [market, openOrder, router, shell, snack],
  );

  const closeTop = useCallback(() => {
    if (menu) return setMenu(null);
    if (hover) return setHover(null);
    if (palette !== null) return closePalette();
    if (keysOpen) return setKeysOpen(false);
    if (drawer) return closeDrawer();
    if (picksOpen) setPicksOpen(false);
  }, [menu, hover, palette, keysOpen, drawer, picksOpen, closePalette, closeDrawer]);

  // Bookmarkable states in the hash (read on load and on every hash change). Applied as a transition: the server
  // rendered without the hash, and Home's sections stream in; an urgent update could reach a section before it has
  // hydrated and make it hydrate against the new state (a text mismatch). A transition lets React hydrate first.
  useEffect(() => {
    const read = () => startTransition(() => {
      const h = new URLSearchParams(window.location.hash.slice(1));
      setExampleClock(h.get("clock") === "open");
      setDrawer(parseDrawer(h.get("drawer")));
      setPalette(h.has("pal") ? (h.get("pal") === "1" ? "" : h.get("pal")) : null);
      setKeysOpen(h.get("keys") === "1");
      setPicksOpen(h.get("picks") === "1");
      const ap = h.get("ap");
      setApproach(ap === "rule" || ap === "hybrid" || ap === "ai" ? ap : "all");
    });
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  // A new market or page closes the overlays.
  useEffect(() => {
    setHover(null);
    setMenu(null);
    setPicksOpen(false);
    setPageItems({});
  }, [market]);

  return {
    data, market, shell, nowMs, exampleClock, status, lock, fmt,
    item: (id: string) => shell.items[id] ?? pageItems[id],
    addItems,
    drawer, openDrawer, closeDrawer, openOrder,
    palette, openPalette, closePalette,
    keysOpen, setKeysOpen,
    hover, openHover: (id, anchor) => { setMenu(null); setHover({ id, anchor }); }, closeHover: () => setHover(null),
    menu, setMenu: (m) => { setHover(null); setMenu(m); },
    picksOpen, setPicksOpen, picksOff, setPicksOff,
    approach, setApproach, density, setDensity, rail, setRail,
    snack, go, closeTop,
    snackText, dismissSnack: () => setSnackText(null),
  };
}
