"use client";
// The bell's notifications and the profile menu (story W8; 30-shell "Bell", "Theme, profile"): each run's events, and
// the reader's choices (theme, density, rail labels). Positioned under their button; a click elsewhere closes them.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { applyTheme, readTheme, saveTheme, type Theme } from "../../lib/ui/theme.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";
import { place } from "./hover-card.tsx";

function Option({ label, on, pick }: { label: string; on: boolean; pick: () => void }) {
  return (
    <button type="button" role="menuitemradio" aria-checked={on} onClick={pick}>
      <Icon name={on ? "check" : "remove"} />
      {label}
    </button>
  );
}

function Notifications() {
  const { data, setMenu } = useFrame();
  return (
    <>
      <div className="mb-pal-group">Notifications</div>
      {data.notifications.map((n) => (
        <button key={n.title} type="button" role="menuitem" className="mb-frame-notif" onClick={() => setMenu(null)}>
          <Icon name={n.icon} />
          <span>
            <b style={{ fontWeight: n.unread ? 700 : 500 }}>{n.title}</b>
            <small className="muted">{n.sub}</small>
          </span>
        </button>
      ))}
      <div className="mb-pal-group plain">Alerts are checked on each data update, not tick by tick. Also sent to Slack.</div>
    </>
  );
}

function Profile() {
  const { density, setDensity, rail, setRail, setMenu, setKeysOpen } = useFrame();
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => setTheme(readTheme()), []);
  const choose = (t: Theme) => {
    saveTheme(t);
    applyTheme(t);
    setMenu(null);
  };
  const then = (fn: () => void) => () => {
    fn();
    setMenu(null);
  };
  return (
    <>
      <div className="mb-pal-group">Theme</div>
      <Option label="Light" on={theme === "light"} pick={() => choose("light")} />
      <Option label="Dark" on={theme === "dark"} pick={() => choose("dark")} />
      <Option label="Follow the system (default)" on={theme === "system"} pick={() => choose("system")} />
      <div className="mb-pal-group">Density</div>
      <Option label="Comfortable" on={density === "comfortable"} pick={then(() => setDensity("comfortable"))} />
      <Option label="Compact (more rows)" on={density === "compact"} pick={then(() => setDensity("compact"))} />
      <div className="mb-pal-group">Navigation rail</div>
      <Option label="Icons with labels" on={rail === "labels"} pick={then(() => setRail("labels"))} />
      <Option label="Icons only" on={rail === "icons"} pick={then(() => setRail("icons"))} />
      <button type="button" role="menuitem" onClick={then(() => setKeysOpen(true))}>
        <Icon name="keyboard" />
        Keyboard shortcuts
        <span className="mb-kbd">?</span>
      </button>
      <div className="mb-pal-group plain">Paper only · no broker is connected</div>
    </>
  );
}

export function FrameMenu() {
  const { menu, setMenu } = useFrame();
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!menu || !box.current) return;
    place(box.current, menu.anchor, "below");
    const right = menu.anchor.getBoundingClientRect().right;
    box.current.style.left = `${Math.max(8, Math.min(innerWidth - box.current.offsetWidth - 8, right - box.current.offsetWidth))}px`;
    box.current.querySelector("button")?.focus();
  }, [menu]);
  useEffect(() => {
    if (!menu) return;
    const away = (e: MouseEvent) => {
      if (e.target instanceof Node && !box.current?.contains(e.target) && !menu.anchor.contains(e.target)) setMenu(null);
    };
    document.addEventListener("click", away);
    return () => document.removeEventListener("click", away);
  }, [menu, setMenu]);
  return (
    <div ref={box} className={`mb-menu${menu ? " on" : ""}`} id="menu" role="menu">
      {menu?.kind === "notifications" ? <Notifications /> : menu?.kind === "profile" ? <Profile /> : null}
    </div>
  );
}
