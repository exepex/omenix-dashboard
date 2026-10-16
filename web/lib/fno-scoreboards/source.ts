// The F&O scoreboards' data interface (story W3h): one read, the page `scoreboards`.
import type { FnoScoreboards } from "./contract.ts";

export interface ScoreboardsData {
  boards(): Promise<FnoScoreboards>;
}
