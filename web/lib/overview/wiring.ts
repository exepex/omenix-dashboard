// The one place the Markets overview's adapter is chosen (stories W12, W2): the F&O product's publications when the
// database is configured, else W11's examples, loaded only then (lib/data/lazy.ts).
import { lazyAdapter } from "../data/lazy.ts";
import { fnoReader } from "../fno/wiring.ts";
import { azureOverviewData } from "./azure-source.ts";
import type { OverviewData } from "./source.ts";

export const overviewData: OverviewData = fnoReader ? azureOverviewData(fnoReader) : lazyAdapter(() => import("./fixture-source.ts").then((m) => m.fixtureOverviewData));
