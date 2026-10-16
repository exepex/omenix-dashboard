// The one place the Forecast lab's adapter is chosen (story W3b): the F&O publication when the database is
// configured, else P1's examples, loaded only then (lib/data/lazy.ts).
import { lazyAdapter } from "../data/lazy.ts";
import { fnoReader } from "../fno/wiring.ts";
import { azureForecastLabData } from "./azure-source.ts";
import type { ForecastLabData } from "./source.ts";

export const forecastLabData: ForecastLabData = fnoReader ? azureForecastLabData(fnoReader) : lazyAdapter(() => import("./fixture-source.ts").then((m) => m.fixtureForecastLabData));

/** The lab is the publication's (a database is configured), never an example: the frame's Example rule reads it. */
export const forecastLabLive = fnoReader !== null;
