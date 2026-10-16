// The frame's navigation (story W8; the signed-off rail of design/mockups/30-shell, design/mockups/_platform/js/2-frame.js
// NAV and PINS): groups with their screens, the pinned screens and the phone tabs, mapped onto the app's real pages
// (lib/ui/routes.ts). A screen the app does not have yet is marked "soon", as in the mockup. India-only screens are
// absent in the US. Pure.
import type { Market } from "../data/constants.ts";
import { pageOfPath, pagePath } from "../ui/routes.ts";

export interface NavScreen {
  id: string;
  label: string;
  icon: string;
  /** The app page (lib/ui/routes.ts key) this screen opens; none = not built yet ("soon"). */
  page?: string;
  /** A frame action instead of a page. */
  action?: "order" | "keys";
  /** India only (absent in the US). */
  india?: boolean;
  key?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: string;
  items: NavScreen[];
}

export const NAV: readonly (NavGroup | null)[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", items: [{ id: "dashboard", label: "Dashboard", icon: "dashboard", page: "home", key: "g h" }] },
  { id: "markets", label: "Markets", icon: "monitoring", items: [{ id: "markets", label: "Markets overview", icon: "monitoring", page: "markets" }, { id: "weather", label: "Market weather", icon: "sensors", page: "weather", india: true }, { id: "watchlists", label: "Watchlists", icon: "star", page: "watchlist" }, { id: "chart", label: "Chart", icon: "show_chart" }, { id: "calendar", label: "Calendar", icon: "calendar_month" }] },
  { id: "trade", label: "Trade", icon: "candlestick_chart", items: [{ id: "chain", label: "Option chain", icon: "layers", india: true }, { id: "builder", label: "Strategy builder", icon: "calculate", india: true }, { id: "screener", label: "Screener", icon: "filter_list", key: "g s", page: "screener" }, { id: "order", label: "Order window", icon: "receipt_long", action: "order", key: "B / S" }] },
  { id: "portfolio", label: "Portfolio", icon: "account_balance_wallet", items: [{ id: "portfolios", label: "Paper portfolios", icon: "account_balance_wallet", page: "portfolios", key: "g p" }, { id: "paper-books", label: "Paper books (F&O)", icon: "account_balance", page: "paper-books", india: true }, { id: "holdings", label: "Holdings", icon: "pie_chart" }, { id: "funds", label: "Accounts and funds", icon: "payments" }, { id: "orders", label: "Orders", icon: "receipt_long", key: "g o" }, { id: "reports", label: "Reports", icon: "bar_chart" }] },
  { id: "strategies", label: "Strategies", icon: "science", items: [{ id: "lab", label: "Strategy lab", icon: "science", page: "lab" }, { id: "track", label: "Track record", icon: "history", page: "track" }, { id: "scoreboards", label: "Scoreboards (Rule vs AI)", icon: "leaderboard", page: "compare" }, { id: "forecasts", label: "Forecast lab", icon: "query_stats", page: "forecasts", india: true }] },
  { id: "research", label: "Research", icon: "travel_explore", items: [{ id: "stock", label: "Companies", icon: "apartment", page: "companies" }, { id: "news", label: "News", icon: "newspaper", page: "news" }, { id: "events", label: "Calendar", icon: "event" }, { id: "alerts", label: "Alerts", icon: "notifications" }] },
  { id: "control", label: "Control", icon: "shield", items: [{ id: "risk", label: "Risk", icon: "shield" }, { id: "judge", label: "Judge and evidence", icon: "gavel" }, { id: "health", label: "Data health", icon: "dns", page: "data-health", india: true }] },
  null,
  { id: "assistant", label: "Assistant", icon: "smart_toy", items: [{ id: "assistant", label: "Assistant", icon: "smart_toy", page: "assistant" }] },
  { id: "help", label: "Help", icon: "help", items: [{ id: "help", label: "Help and glossary", icon: "help", page: "help" }, { id: "shortcuts", label: "Keyboard shortcuts", icon: "keyboard", action: "keys", key: "?" }] },
  { id: "settings", label: "Settings", icon: "settings", items: [{ id: "settings", label: "Settings", icon: "settings" }] },
];

export interface Pin {
  label: string;
  short: string;
  icon: string;
  screen: string;
  india?: boolean;
}

export const PINS: readonly Pin[] = [
  { label: "Pinned: NIFTY option chain", short: "NIFTY chain", icon: "layers", india: true, screen: "chain" },
  { label: 'Pinned: saved screen "High IV rank, rising open interest"', short: "High IV", icon: "filter_list", india: true, screen: "screener" },
  { label: "Pinned: Stock tool scoreboard (Rule vs AI)", short: "Rule vs AI", icon: "leaderboard", screen: "scoreboards" },
];

export const SOON = "This screen is not built yet.";

/** The groups of a market: India-only screens absent without F&O; empty groups dropped; null is a separator. */
export function navGroups(fno: boolean): (NavGroup | null)[] {
  return NAV.map((g) => (g ? { ...g, items: g.items.filter((i) => fno || !i.india) } : null)).filter((g) => g === null || g.items.length > 0);
}

export const pins = (fno: boolean): Pin[] => PINS.filter((p) => fno || !p.india);

/** Every screen of a market with its group. */
export function allScreens(fno: boolean): (NavScreen & { group: NavGroup })[] {
  return navGroups(fno).flatMap((g) => (g ? g.items.map((i) => ({ ...i, group: g })) : []));
}

export const screenById = (fno: boolean, id: string) => allScreens(fno).find((s) => s.id === id);

/** The URL of a screen, or null when it is an action or not built yet. */
export const screenHref = (market: Market, s: NavScreen): string | null => (s.page ? pagePath(market, s.page) : null);

/** The rail group the page of a pathname belongs to (the per-stock pages hang off Research), or null (the gallery). */
export function currentGroup(pathname: string): string | null {
  const key = pageOfPath(pathname).key;
  if (key === "company" || key === "strategies") return "research";
  for (const g of NAV) if (g && g.items.some((i) => i.page === key)) return g.id;
  return null;
}

/** The screen id of the page of a pathname, or null. */
export function currentScreen(pathname: string): string | null {
  const key = pageOfPath(pathname).key;
  for (const g of NAV) for (const i of g?.items ?? []) if (i.page === key) return i.id;
  return null;
}

/** The phone tabs: Home, Picks, Orders, Portfolio, More (30-shell). */
export const PHONE_TABS = [
  { id: "home", label: "Home", icon: "home", screen: "dashboard" },
  { id: "picks", label: "Picks", icon: "bolt" },
  { id: "orders", label: "Orders", icon: "receipt_long", screen: "orders" },
  { id: "portfolio", label: "Portfolio", icon: "account_balance_wallet", screen: "portfolios" },
  { id: "more", label: "More", icon: "menu" },
] as const;
