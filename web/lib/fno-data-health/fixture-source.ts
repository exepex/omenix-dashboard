// Fixture adapter of the F&O data health (story W3e): P1's contract examples (api/examples/fno-screens.json, copied by
// tools/sync-design.mjs), served only without a database and labelled Example on the page. The good case by default.
import raw from "../fixtures/fno-screens.generated.json" with { type: "json" };
import { exampleReader } from "../fixtures/examples.ts";
import type { FnoDataHealth } from "./contract.ts";
import type { DataHealthData } from "./source.ts";

/** Data sources and runs only: no strategy names, so no display-name rule. */
const read = exampleReader(raw, { strategies: false });

export const HEALTH_EXAMPLES = ["getFnoDataHealth_india_ok", "getFnoDataHealth_india_problems", "getFnoDataHealth_india_none"] as const;

export const fixtureDataHealthData: DataHealthData = { health: async () => read<FnoDataHealth>(HEALTH_EXAMPLES[0]) };

/** Every example state, for the tests (good, bad and empty). */
export const healthExample = (name: (typeof HEALTH_EXAMPLES)[number]) => read<FnoDataHealth>(name);
