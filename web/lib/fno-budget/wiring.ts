// The one place the AI usage and budget's adapter is chosen (story W3g): the F&O publication when the database is
// configured, else P1's examples, loaded only then (lib/data/lazy.ts).
import { lazyAdapter } from "../data/lazy.ts";
import { fnoReader } from "../fno/wiring.ts";
import { azureBudgetData } from "./azure-source.ts";
import type { BudgetData } from "./source.ts";

export const budgetData: BudgetData = fnoReader ? azureBudgetData(fnoReader) : lazyAdapter(() => import("./fixture-source.ts").then((m) => m.fixtureBudgetData));

/** The budget is the publication's (a database is configured), never an example: the frame's Example rule reads it. */
export const budgetLive = fnoReader !== null;
