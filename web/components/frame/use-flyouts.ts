"use client";
// The navigation rail's flyouts (story W14, owner's feedback of 13 Oct 2026): a flyout shows on hover or keyboard
// focus (components.css), and closes on a move to another screen, on Escape and on a click elsewhere. Root cause of
// the report: the clicked link kept the keyboard focus after a client-side move, so `:focus-within` held the flyout
// open until a click elsewhere. A closed group carries `.shut` until the pointer comes back to it or the keyboard
// moves into it from outside; when the focus was inside the closing flyout, it returns to the group's rail item.
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";

export interface Flyouts {
  isShut: (id: string) => boolean;
  reopen: (id: string) => void;
  onFocusGroup: (id: string, e: FocusEvent<HTMLElement>) => void;
  onKeyGroup: (id: string, e: KeyboardEvent<HTMLElement>) => void;
}

const railItemOf = (node: Element | null) => node?.closest(".mb-rail-grp")?.querySelector<HTMLElement>(".mb-rail-item") ?? null;

export function useFlyouts(ids: readonly string[]): Flyouts {
  const pathname = usePathname();
  const [shut, setShut] = useState<ReadonlySet<string>>(() => new Set());
  const shown = useRef(pathname);
  const shutAll = useCallback(() => setShut(new Set(ids)), [ids]);
  useEffect(() => {
    if (shown.current === pathname) return;
    shown.current = pathname;
    const focused = document.activeElement;
    if (focused?.closest(".mb-rail-fly")) railItemOf(focused)?.focus();
    shutAll();
  }, [pathname, shutAll]);
  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (e.target instanceof Element && !e.target.closest(".mb-navrail")) shutAll();
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [shutAll]);
  const reopen = useCallback((id: string) => setShut((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : s)), []);
  const onFocusGroup = useCallback(
    (id: string, e: FocusEvent<HTMLElement>) => {
      if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) reopen(id);
    },
    [reopen],
  );
  const onKeyGroup = useCallback(
    (id: string, e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Escape") {
        setShut((s) => new Set([...s, id]));
        railItemOf(e.target as Element)?.focus();
      } else if (e.key === "ArrowDown" && (e.target as Element).matches(".mb-rail-item")) {
        e.preventDefault();
        reopen(id);
        const group = e.currentTarget;
        requestAnimationFrame(() => group.querySelector<HTMLElement>(".mb-rail-fly a")?.focus());
      }
    },
    [reopen],
  );
  return { isShut: (id) => shut.has(id), reopen, onFocusGroup, onKeyGroup };
}
