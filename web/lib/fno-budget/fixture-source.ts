// Fixture adapter of the AI usage and budget (story W3g): P1's contract examples (api/examples/fno-screens.json, copied
// by tools/sync-design.mjs), served only without a database and labelled Example on the page. The good case by default.
import raw from "../fixtures/fno-screens.generated.json" with { type: "json" };
import { exampleReader } from "../fixtures/examples.ts";
import type { FnoBudget } from "./contract.ts";
import type { BudgetData } from "./source.ts";

/** Minutes by kind of work only: no strategy names, so no display-name rule. */
const read = exampleReader(raw, { strategies: false });

export const BUDGET_EXAMPLES = ["getFnoBudget_india_ok", "getFnoBudget_india_alert", "getFnoBudget_india_none"] as const;

export const fixtureBudgetData: BudgetData = { budget: async () => read<FnoBudget>(BUDGET_EXAMPLES[0]) };

/** Every example state, for the tests (good, bad and empty). */
export const budgetExample = (name: (typeof BUDGET_EXAMPLES)[number]) => read<FnoBudget>(name);
