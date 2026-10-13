// The Strategy lab's shared parts (B16; split by W14): the page's payload and view, and small helpers its cards use.
import type { GoLive, PageBase } from "../../../../../lib/ui/types.ts";
import { noneFinishedYet } from "../../../../../lib/ui/empty.ts";
import type { Basis, CostView, ScoreView } from "../../../../../lib/strategy-pages/scoreboard.ts";
import type { StrategyLabPayload } from "../../../../../lib/strategy-pages/strategy-lab.ts";

export type Payload = PageBase & StrategyLabPayload & { go_live: GoLive | null };
export type Horizon = number | "all";

export interface View {
  view: ScoreView;
  basis: Basis;
  cost: CostView;
  horizon: Horizon;
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
/** "No paper trade has finished yet. …; results appear at the after-close run (next: …)." (review section 4) */
export const noneYet = (p: Payload) => noneFinishedYet([], p.status.runs.post_close?.next_at, p.market, p.status.session.local_time);

export function NotStored() {
  return <span className="muted" data-tip="Not stored for the your-cost view (a back-test row stores profit and mean return only).">not stored</span>;
}
