// The AI usage and budget's data interface (story W3g): one read, the page `budget`.
import type { FnoBudget } from "./contract.ts";

export interface BudgetData {
  budget(): Promise<FnoBudget>;
}
