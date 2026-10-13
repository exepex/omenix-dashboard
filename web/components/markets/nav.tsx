"use client";
// The Markets overview's choices (story W12): every one is a URL change (lib/overview/state.ts), so the server reads the
// blocks the view shows and the view is a link.
import { usePathname, useRouter } from "next/navigation";
import { marketsSearch, type MarketsState } from "../../lib/overview/state.ts";
import { useBlockTransition } from "../ui/pending.tsx";

/** Moves to a changed view (scroll kept); the block holding the control shows its loader until the view lands (W14). */
export function useMarketsNav(state: MarketsState) {
  const router = useRouter();
  const pathname = usePathname();
  const start = useBlockTransition();
  return (change: Partial<MarketsState>) => start(() => router.push(`${pathname}${marketsSearch({ ...state, ...change })}`, { scroll: false }));
}
