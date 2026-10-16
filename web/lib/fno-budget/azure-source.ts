// The AI usage and budget on exepex/trading's F&O publication (story W3g): page `budget`. No page yet is the empty state
// with its reason (lib/fno/blocks.ts), never an example.
import { payloadsOf, type FnoBlockReader } from "../fno/blocks.ts";
import { FNO_PAGES } from "../fno/pages.ts";
import type { FnoBudget } from "./contract.ts";
import type { BudgetData } from "./source.ts";

export function azureBudgetData(reader: FnoBlockReader): BudgetData {
  const payload = payloadsOf(reader);
  return { budget: () => payload<FnoBudget>(FNO_PAGES.getFnoBudget) };
}
