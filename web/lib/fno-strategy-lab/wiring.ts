// The one place the Strategy lab's F&O adapter is chosen (story W3d): the F&O publication when the database is
// configured, else P1's examples, loaded only then (lib/data/lazy.ts).
import { lazyAdapter } from "../data/lazy.ts";
import { fnoReader } from "../fno/wiring.ts";
import { azureStrategyLabFnoData } from "./azure-source.ts";
import type { StrategyLabFnoData } from "./source.ts";

export const strategyLabFnoData: StrategyLabFnoData = fnoReader ? azureStrategyLabFnoData(fnoReader) : lazyAdapter(() => import("./fixture-source.ts").then((m) => m.fixtureStrategyLabFnoData));

/** The tab is the publication's (a database is configured), never an example: the frame's Example rule reads it. */
export const strategyLabFnoLive = fnoReader !== null;
