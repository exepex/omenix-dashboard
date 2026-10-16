// The F&O scoreboards' read model (story W3h; contract FnoScoreboards, api/schemas/fno-scoreboards.yaml, 2.8.0): what
// the page `scoreboards` of exepex/trading's F&O publication carries. Scoreboard B (whole systems) and A (matched
// decisions), each per book after all costs, never combined into one figure and never merged with the stock tool's.
// Types only.
import type { FnoFamily } from "../fno-forecast-lab/contract.ts";

export interface BoardBook {
  family: FnoFamily;
  trades: number;
  net: number;
  worst_month: number | null;
  max_drawdown: number;
  beats_do_nothing: "yes" | "no" | "not_tested" | null;
}

export interface FnoScoreboard {
  status: "ok" | "pilot" | "not_run";
  as_of: string | null;
  label: string;
  do_nothing_net: number | null;
  books: BoardBook[];
}

export interface FnoScoreboards {
  board_b: FnoScoreboard;
  board_a: FnoScoreboard;
}
