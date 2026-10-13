"use client";
// The navigation rail (story W8; 30-shell "Navigation rail, flyouts, pinned"): groups with their screens in a flyout on
// hover or focus, the current group marked, pinned screens below. India-only screens are absent in the US. A screen
// the app does not have yet says so ("soon"), as in the mockup. A flyout closes on a move to another screen, on Escape
// and on a click elsewhere (use-flyouts.ts, W14).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { SOON, currentGroup, currentScreen, navGroups, pins, screenHref, type NavGroup, type NavScreen } from "../../lib/shell/nav.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";
import { useFlyouts, type Flyouts } from "./use-flyouts.ts";

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
  // A screen not built yet is visible and disabled (W14): no address, no action, out of the Tab order; the reason is its
  // tooltip and the "soon" beside it.
  if (soon) {
    return (
      <a role="menuitem" aria-disabled="true" tabIndex={-1} data-tip={SOON}>
        <Icon name={s.icon} />
        {s.label}
        {extra}
      </a>
    );
  }
  return (
    <a href="#" role="menuitem" onClick={(e) => { e.preventDefault(); go(s); }}>
      <Icon name={s.icon} />
      {s.label}
      {extra}
    </a>
  );
}

function Group({ g, fly }: { g: NavGroup; fly: Flyouts }) {
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
    <div className={fly.isShut(g.id) ? "mb-rail-grp shut" : "mb-rail-grp"} onPointerEnter={() => fly.reopen(g.id)} onFocus={(e) => fly.onFocusGroup(g.id, e)} onKeyDown={(e) => fly.onKeyGroup(g.id, e)}>
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
  const groups = useMemo(() => navGroups(shell.fno), [shell.fno]);
  const ids = useMemo(() => groups.flatMap((g) => (g ? [g.id] : [])), [groups]);
  const fly = useFlyouts(ids);
  return (
    <nav className="mb-navrail" aria-label="Screens">
      {groups.map((g, i) => (g ? <Group key={g.id} g={g} fly={fly} /> : <div key={`sep${i}`} className="mb-rail-sep" role="separator" />))}
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
