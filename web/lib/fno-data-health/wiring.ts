// The one place the F&O data health's adapter is chosen (story W3e): the F&O publication when the database is
// configured, else P1's examples, loaded only then (lib/data/lazy.ts).
import { lazyAdapter } from "../data/lazy.ts";
import { fnoReader } from "../fno/wiring.ts";
import { azureDataHealthData } from "./azure-source.ts";
import type { DataHealthData } from "./source.ts";

export const dataHealthData: DataHealthData = fnoReader ? azureDataHealthData(fnoReader) : lazyAdapter(() => import("./fixture-source.ts").then((m) => m.fixtureDataHealthData));

/** The health is the publication's (a database is configured), never an example: the frame's Example rule reads it. */
export const dataHealthLive = fnoReader !== null;
