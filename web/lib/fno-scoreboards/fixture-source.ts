// Fixture adapter of the F&O scoreboards (story W3h): P1's contract examples (api/examples/fno-screens.json, copied by
// tools/sync-design.mjs), served only without a database and labelled Example on the page. The good case by default.
import raw from "../fixtures/fno-screens.generated.json" with { type: "json" };
import { exampleReader } from "../fixtures/examples.ts";
import type { FnoScoreboards } from "./contract.ts";
import type { ScoreboardsData } from "./source.ts";

/** Books only, by family: no strategy names, so no display-name rule. */
const read = exampleReader(raw, { strategies: false });

export const BOARDS_EXAMPLES = ["getFnoScoreboards_india_ahead", "getFnoScoreboards_india_behind", "getFnoScoreboards_india_none"] as const;

export const fixtureScoreboardsData: ScoreboardsData = { boards: async () => read<FnoScoreboards>(BOARDS_EXAMPLES[0]) };

/** Every example state, for the tests (good, bad and empty). */
export const boardsExample = (name: (typeof BOARDS_EXAMPLES)[number]) => read<FnoScoreboards>(name);
