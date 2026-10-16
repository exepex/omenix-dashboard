// The F&O scoreboards on exepex/trading's F&O publication (story W3h): page `scoreboards`. No page yet is the empty
// state with its reason (lib/fno/blocks.ts), never an example.
import { payloadsOf, type FnoBlockReader } from "../fno/blocks.ts";
import { FNO_PAGES } from "../fno/pages.ts";
import type { FnoScoreboards } from "./contract.ts";
import type { ScoreboardsData } from "./source.ts";

export function azureScoreboardsData(reader: FnoBlockReader): ScoreboardsData {
  const payload = payloadsOf(reader);
  return { boards: () => payload<FnoScoreboards>(FNO_PAGES.getFnoScoreboards) };
}
