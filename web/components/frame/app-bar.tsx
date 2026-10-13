"use client";
// The app bar (story W8; 30-shell "App bar"): brand with "Research · Paper only", the one search box, the India / US
// switch, the market status chip (open or closed, and when that changes), the index strip (hidden on Home), the picks
// panel toggle, the bell, Ask (the assistant's chat panel), the theme button and the profile menu.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MARKETS } from "../../lib/data/constants.ts";
import { asOf } from "../../lib/shell/clock.ts";
import { marketTip } from "../../lib/shell/market.ts";
import { pageOfPath, pagePath, switchMarketPath } from "../../lib/ui/routes.ts";
import { useChatPanel } from "../shell/chat-panel.tsx";
import { ThemeToggle } from "../shell/theme-toggle.tsx";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";
import { Delta } from "./parts.tsx";

const WIDE = "(min-width: 1200px)";

function MarketSwitch() {
  const { data, market } = useFrame();
  const pathname = usePathname() ?? `/${market}`;
  const router = useRouter();
  const page = pageOfPath(pathname);
  const perStock = page.key === "company" || page.key === "strategies";
  return (
    <div className="md-segmented dense light" role="group" aria-label="Market">
      {MARKETS.map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={m === market}
          data-tip={perStock ? `Switch to the ${data.marketLabels[m]} watchlist (a company belongs to one market)` : `Switch to the ${data.marketLabels[m]} ${page.label} page`}
          onClick={() => m !== market && router.push(switchMarketPath(pathname, m))}
        >
          {data.marketLabels[m]}
        </button>
      ))}
    </div>
  );
}

function MarketChip() {
  const { shell, status, exampleClock } = useFrame();
  return (
    <span className={`mb-mkt${status.open ? " open" : ""}`} role="status" data-tip={marketTip(shell, status, exampleClock)}>
      <i aria-hidden="true" />
      <b>{status.word}</b>
      <span className="t">{status.text}</span>
    </span>
  );
}

function IndexStrip() {
  const { data, shell, fmt, go } = useFrame();
  return (
    <div className="mb-idx-strip" aria-label="Indices">
      {shell.indices.map((id) => {
        const it = shell.items[id];
        const a = asOf(it, data);
        return (
          <a key={id} className={`mb-idx${a.stale ? " stale" : ""}`} href="#" data-tip={`${it.sym}: ${a.tip}`} onClick={(e) => { e.preventDefault(); go("markets"); }}>
            <span className="n">{it.sym}</span>
            <span className="v">{fmt.price(it.last)}</span>
            <Delta value={it.chg_pct} />
          </a>
        );
      })}
    </div>
  );
}

/** Ask the assistant (B8's chat panel on every page; the assistant's page when no panel is mounted). Not in the
 *  mockup, which predates the panel: kept so the existing chat panel stays reachable. Phones have it in More (the
 *  signed-off phone bar has no room), drawer.tsx. */
function AskButton() {
  const { market } = useFrame();
  const chat = useChatPanel();
  const tip = "Ask the assistant: answers cite ids and as-of times, read-only.";
  if (!chat.available) {
    return (
      <Link className="md-icon-btn hide-phone" href={pagePath(market, "assistant")} data-tip={tip} aria-label="Ask the assistant">
        <Icon name="smart_toy" />
      </Link>
    );
  }
  return (
    <button className="md-icon-btn hide-phone" type="button" data-tip={tip} aria-label="Ask the assistant" aria-expanded={chat.open} aria-controls="mb-chat-slot" onClick={chat.toggle}>
      <Icon name="smart_toy" />
    </button>
  );
}

export function AppBar() {
  const ui = useFrame();
  const { shell, market, data, picksOff, picksOpen, setPicksOff, setPicksOpen, setMenu, openPalette } = ui;
  const pathname = usePathname() ?? `/${market}`;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const unread = data.notifications.filter((n) => n.unread).length;
  const onHome = pageOfPath(pathname).key === "home";
  return (
    <header className={`mb-appbar${scrolled ? " scrolled" : ""}`} id="appbar">
      <Link className="mb-appbar-brand" href={pagePath(market, "home")} aria-label="Omenix: Dashboard">
        <span className="mb-brand-mark">
          <svg className="mb-logo" aria-hidden="true"><use href="#mb-logo" /></svg>
        </span>
      </Link>
      <div className="mb-appbar-name">
        Omenix<small>Research · Paper only</small>
      </div>
      <button className="mb-gsearch" type="button" onClick={() => openPalette("")} aria-label="Search stocks, F&O, screens (slash)">
        <Icon name="search" />
        <span className="lg">{shell.fno ? "Search stocks, F&O, codes" : "Search stocks"}</span>
        <span className="sm">Search…</span>
        <span className="mb-kbd">/</span>
      </button>
      <MarketSwitch />
      <MarketChip />
      {onHome ? null : <IndexStrip />}
      <div className="mb-appbar-end">
        <button
          className="md-icon-btn hide-phone"
          type="button"
          aria-label={picksOff ? "Show today’s picks" : "Hide today’s picks"}
          data-tip={`${picksOff ? "Show" : "Hide"} today’s picks panel`}
          onClick={() => (window.matchMedia(WIDE).matches ? setPicksOff(!picksOff) : setPicksOpen(!picksOpen))}
        >
          <Icon name="dock_to_left" />
        </button>
        <button className="md-icon-btn mb-badged" type="button" id="bell" aria-label={`Notifications, ${unread} unread`} onClick={(e) => setMenu({ kind: "notifications", anchor: e.currentTarget })}>
          <Icon name="notifications" />
          {unread ? <span className="md-badge count">{unread}</span> : null}
        </button>
        <AskButton />
        <ThemeToggle />
        <button className="mb-me" type="button" id="me" aria-label="Profile and settings" aria-haspopup="menu" onClick={(e) => setMenu({ kind: "profile", anchor: e.currentTarget })}>
          OW
        </button>
      </div>
    </header>
  );
}
