// Fixture adapter of the Strategy lab's F&O tab (story W3d): P1's contract examples (api/examples/fno-screens.json,
// copied by tools/sync-design.mjs), served only without a database and labelled Example on the page. The good case by
// default.
import raw from "../fixtures/fno-screens.generated.json" with { type: "json" };
import { exampleReader } from "../fixtures/examples.ts";
import type { FnoStrategyLab } from "./contract.ts";
import type { StrategyLabFnoData } from "./source.ts";

/** Strategy versions carry display names only (the contract never sends a backend id), so no strategy-name rule. */
const read = exampleReader(raw, { strategies: false });

export const LAB_FNO_EXAMPLES = ["getFnoStrategyLab_india_passed", "getFnoStrategyLab_india_paused", "getFnoStrategyLab_india_none"] as const;

export const fixtureStrategyLabFnoData: StrategyLabFnoData = { lab: async () => read<FnoStrategyLab>(LAB_FNO_EXAMPLES[0]) };

/** Every example state, for the tests (good, bad and empty). */
export const labFnoExample = (name: (typeof LAB_FNO_EXAMPLES)[number]) => read<FnoStrategyLab>(name);
