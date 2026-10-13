"use client";
// The Markets overview's choices (story W12): every one is a URL change (lib/overview/state.ts), so the server reads the
// blocks the view shows and the view is a link.
import { usePathname, useRouter } from "next/navigation";
import { marketsSearch, type MarketsState } from "../../lib/overview/state.ts";

export function useMarketsNav(state: MarketsState) {
  const router = useRouter();
  const pathname = usePathname();
  return (change: Partial<MarketsState>) => router.push(`${pathname}${marketsSearch({ ...state, ...change })}`, { scroll: false });
}

/** A section head: title, what it answers, an optional link. */
export function Head({ title, sub, go }: { title: string; sub?: string; go?: React.ReactNode }) {
  return <div className="sec-head"><h2>{title}</h2>{sub ? <span className="sub">{sub}</span> : null}{go}</div>;
}
