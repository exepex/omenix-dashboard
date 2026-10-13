"use client";
// The app frame's shared state (story W8): the market's frame data (lib/shell/contract.ts, read through the ShellData
// interface by the market layout), the clock, the one trade lock, and the open overlays. Components read it with
// useFrame(); none imports an adapter or a data client.
import { createContext, useContext } from "react";
import type { Market } from "../../lib/data/constants.ts";
import type { FrameData, Instrument, MarketShell } from "../../lib/shell/contract.ts";
import type { MarketState } from "../../lib/shell/market.ts";
import type { NavScreen } from "../../lib/shell/nav.ts";
import type { Side } from "../../lib/shell/order.ts";

export type DrawerView = { kind: "order"; id: string; side: Side } | { kind: "quick"; id: string } | { kind: "nav" };
export type MenuView = { kind: "notifications" | "profile"; anchor: HTMLElement };
export type Density = "comfortable" | "compact";
export type RailMode = "labels" | "icons";
/** The picks panel's filter: every approach, or one. */
export type Approach = "all" | "rule" | "hybrid" | "ai";

export interface Formats {
  /** Money in the market's currency: whole rupees, cents for dollars, unless `decimals` says otherwise. */
  money: (x: number | null | undefined, decimals?: number, sign?: boolean) => string;
  /** A price with two decimals in the market's locale. */
  price: (x: number | null | undefined) => string;
}

export interface FrameUi {
  data: FrameData;
  market: Market;
  shell: MarketShell;
  /** The instant the frame is drawn at (epoch ms). */
  nowMs: number;
  /** The labelled example clock (during the session) is on. */
  exampleClock: boolean;
  status: MarketState;
  /** The one trade lock (lib/shell/market.ts tradeLock): the reason every manual Buy and Sell is disabled, or null. */
  lock: string | null;
  fmt: Formats;
  item: (id: string) => Instrument | undefined;
  drawer: DrawerView | null;
  openDrawer: (view: DrawerView) => void;
  /** Closes the drawer; focus returns where it was unless `restore` is false (the next view takes focus itself). */
  closeDrawer: (restore?: unknown) => void;
  openOrder: (id: string, side: Side) => void;
  palette: string | null;
  openPalette: (query?: string) => void;
  closePalette: () => void;
  keysOpen: boolean;
  setKeysOpen: (open: boolean) => void;
  hover: { id: string; anchor: HTMLElement } | null;
  openHover: (id: string, anchor: HTMLElement) => void;
  closeHover: () => void;
  menu: MenuView | null;
  setMenu: (menu: MenuView | null) => void;
  /** The picks panel as an overlay (below 1200 px) or the phone's Picks tab. */
  picksOpen: boolean;
  setPicksOpen: (open: boolean) => void;
  /** The picks panel hidden on a wide screen. */
  picksOff: boolean;
  setPicksOff: (off: boolean) => void;
  approach: Approach;
  setApproach: (a: Approach) => void;
  density: Density;
  setDensity: (d: Density) => void;
  rail: RailMode;
  setRail: (r: RailMode) => void;
  snack: (message: string) => void;
  /** Open a screen of the navigation: its page, its action, or the "not built yet" note. */
  go: (screen: NavScreen | string) => void;
  /** Close the topmost overlay (Escape, the veil). */
  closeTop: () => void;
}

export const FrameContext = createContext<FrameUi | null>(null);

export function useFrame(): FrameUi {
  const ui = useContext(FrameContext);
  if (!ui) throw new Error("useFrame outside the app frame");
  return ui;
}
