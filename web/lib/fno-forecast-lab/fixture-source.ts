// Fixture adapter of the Forecast lab (story W3b): P1's contract examples (api/examples/fno-screens.json, copied by
// tools/sync-design.mjs), served only without a database and labelled Example on the page. The good case by default.
import raw from "../fixtures/fno-screens.generated.json" with { type: "json" };
import { exampleReader } from "../fixtures/examples.ts";
import type { FnoForecastLab } from "./contract.ts";
import type { ForecastLabData } from "./source.ts";

/** Forecasters are named by the payload's own display names, never a model name; no strategy-name rule applies. */
const read = exampleReader(raw, { strategies: false });

export const LAB_EXAMPLES = ["getFnoForecastLab_india_winning", "getFnoForecastLab_india_losing", "getFnoForecastLab_india_waiting"] as const;

export const fixtureForecastLabData: ForecastLabData = { lab: async () => read<FnoForecastLab>(LAB_EXAMPLES[0]) };

/** Every example state, for the tests (good, bad and empty). */
export const labExample = (name: (typeof LAB_EXAMPLES)[number]) => read<FnoForecastLab>(name);
