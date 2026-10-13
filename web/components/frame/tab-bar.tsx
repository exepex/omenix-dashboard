"use client";
// The phone bottom tabs (story W8; 30-shell): Home, Picks, Orders, Portfolio, More. Picks opens the picks panel; More
// lists every screen in the drawer. A tab whose screen is not built yet says so.
import { usePathname } from "next/navigation";
import { currentGroup, currentScreen, PHONE_TABS } from "../../lib/shell/nav.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";

export function TabBar() {
  const { picksOpen, setPicksOpen, openDrawer, go } = useFrame();
  const pathname = usePathname() ?? "";
  const screen = currentScreen(pathname);
  const group = currentGroup(pathname);
  const on: Record<(typeof PHONE_TABS)[number]["id"], boolean> = {
    home: !picksOpen && screen === "dashboard",
    picks: picksOpen,
    orders: false,
    portfolio: !picksOpen && group === "portfolio",
    more: !picksOpen && screen !== "dashboard" && group !== "portfolio",
  };
  const act = (id: (typeof PHONE_TABS)[number]["id"]) => {
    if (id === "picks") return setPicksOpen(!picksOpen);
    setPicksOpen(false);
    if (id === "more") return openDrawer({ kind: "nav" });
    const tab = PHONE_TABS.find((t) => t.id === id);
    if (tab && "screen" in tab) go(tab.screen);
  };
  return (
    <nav className="mb-navbar" id="tabs" aria-label="Main">
      {PHONE_TABS.map((t) => (
        <a key={t.id} className="mb-nav-item" href="#" data-tab={t.id} aria-current={on[t.id] ? "page" : undefined} onClick={(e) => { e.preventDefault(); act(t.id); }}>
          <span className="mb-nav-ind">
            <Icon name={t.icon} />
          </span>
          {t.label}
        </a>
      ))}
    </nav>
  );
}
