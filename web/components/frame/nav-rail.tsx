"use client";
// The navigation rail (story W8; 30-shell "Navigation rail, flyouts, pinned"): groups with their screens in a flyout on
// hover or focus, the current group marked, pinned screens below. India-only screens are absent in the US. A screen
// the app does not have yet says so ("soon"), as in the mockup.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SOON, currentGroup, currentScreen, navGroups, pins, screenHref, type NavGroup, type NavScreen } from "../../lib/shell/nav.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";

function ScreenLink({ s }: { s: NavScreen }) {
  const { market, go } = useFrame();
  const pathname = usePathname() ?? "";
  const href = screenHref(market, s);
  const soon = !href && !s.action;
  const extra = s.key ? <small>{s.key}</small> : soon ? <small>soon</small> : null;
  if (href) {
    return (
      <Link href={href} role="menuitem" aria-current={currentScreen(pathname) === s.id ? "page" : undefined}>
        <Icon name={s.icon} />
        {s.label}
        {extra}
      </Link>
    );
  }
  return (
    <a href="#" role="menuitem" aria-disabled={soon ? "true" : undefined} data-tip={soon ? SOON : undefined} onClick={(e) => { e.preventDefault(); go(s); }}>
      <Icon name={s.icon} />
      {s.label}
      {extra}
    </a>
  );
}

function Group({ g }: { g: NavGroup }) {
  const { market, go } = useFrame();
  const pathname = usePathname() ?? "";
  const first = g.items.find((i) => i.page) ?? g.items[0];
  const href = screenHref(market, first);
  const inner = (
    <>
      <span className="mb-nav-ind">
        <Icon name={g.icon} />
      </span>
      <span className="mb-nav-label">{g.label}</span>
    </>
  );
  const current = currentGroup(pathname) === g.id ? "page" : undefined;
  const popup = g.items.length > 1 ? "menu" : undefined;
  return (
    <div className="mb-rail-grp">
      {href ? (
        <Link className="mb-rail-item" href={href} aria-current={current} aria-haspopup={popup}>
          {inner}
        </Link>
      ) : (
        <a className="mb-rail-item" href="#" aria-current={current} aria-haspopup={popup} onClick={(e) => { e.preventDefault(); go(first); }}>
          {inner}
        </a>
      )}
      {g.items.length > 1 || !href ? (
        <div className="mb-rail-fly" role="menu" aria-label={g.label}>
          <div className="t">{g.label}</div>
          {g.items.map((s) => (
            <ScreenLink key={s.id} s={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function NavRail() {
  const { shell, go } = useFrame();
  const pinned = pins(shell.fno);
  return (
    <nav className="mb-navrail" aria-label="Screens">
      {navGroups(shell.fno).map((g, i) => (g ? <Group key={g.id} g={g} /> : <div key={`sep${i}`} className="mb-rail-sep" role="separator" />))}
      {pinned.length ? (
        <>
          <div className="mb-rail-sep" role="separator" />
          <div className="mb-rail-pins-t">
            <Icon name="push_pin" />
            Pinned
          </div>
          {pinned.map((p) => (
            <a key={p.short} className="mb-rail-pin" href="#" data-tip={p.label} aria-label={p.label} onClick={(e) => { e.preventDefault(); go(p.screen); }}>
              <Icon name={p.icon} />
              <span>{p.short}</span>
            </a>
          ))}
        </>
      ) : null}
    </nav>
  );
}
