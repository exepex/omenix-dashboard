"use client";
// The Screener's controls (story W12): every choice is a URL change (lib/screener/state.ts), so the server reads exactly
// the blocks the view shows and the view is a link. The screens' chips and the pager (choices: ui/controls.tsx).
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { stateSearch, type ScreenerState } from "../../lib/screener/state.ts";
import { Icon } from "../ui/icon.tsx";
import { useBlockTransition } from "../ui/pending.tsx";

/** Moves to a changed state (scroll kept); the block holding the control shows its loader until the view lands (W14). */
export function useScreenerNav(state: ScreenerState) {
  const router = useRouter();
  const pathname = usePathname();
  const start = useBlockTransition();
  return (change: Partial<ScreenerState>) => start(() => router.push(`${pathname}${stateSearch({ ...state, ...change })}`, { scroll: false }));
}

/** A ready-made screen's chip with its count. */
export function ScreenChip({ label, tip, on, toggle, children }: { label: string; tip: string; on: boolean; toggle: () => void; children: ReactNode }) {
  return (
    <button className="md-chip filter" type="button" aria-pressed={on} data-tip={tip} onClick={toggle}>
      {label}
      <span className="n">{children}</span>
    </button>
  );
}

/** "1–25 of 2,924" and the page arrows. */
export function Pager({ total, page, size, locale, go }: { total: number; page: number; size: number; locale: string; go: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pager">
      <span>{total ? `${(page - 1) * size + 1}–${Math.min(total, page * size)} of ${total.toLocaleString(locale)}` : ""}</span>
      <button className="md-icon-btn small" type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => go(page - 1)}><Icon name="chevron_left" /></button>
      <button className="md-icon-btn small" type="button" aria-label="Next page" disabled={page >= pages} onClick={() => go(page + 1)}><Icon name="chevron_right" /></button>
    </div>
  );
}
