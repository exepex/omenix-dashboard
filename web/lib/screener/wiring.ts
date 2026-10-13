// The one place the Screener's adapter is chosen (stories W12, W2): the F&O product's publications when the database is
// configured, else W11's examples, loaded only then (lib/data/lazy.ts).
import { lazyAdapter } from "../data/lazy.ts";
import { fnoReader } from "../fno/wiring.ts";
import { azureScreenerData } from "./azure-source.ts";
import type { ScreenerData } from "./source.ts";

export const screenerData: ScreenerData = fnoReader ? azureScreenerData(fnoReader) : lazyAdapter(() => import("./fixture-source.ts").then((m) => m.fixtureScreenerData));
