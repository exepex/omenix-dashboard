// The one place the market weather's adapter is chosen (story W3a): the F&O publication when the database is
// configured, else P1's examples, loaded only then (lib/data/lazy.ts).
import { lazyAdapter } from "../data/lazy.ts";
import { fnoReader } from "../fno/wiring.ts";
import { azureWeatherData } from "./azure-source.ts";
import type { WeatherData } from "./source.ts";

export const weatherData: WeatherData = fnoReader ? azureWeatherData(fnoReader) : lazyAdapter(() => import("./fixture-source.ts").then((m) => m.fixtureWeatherData));

/** The weather is the publication's (a database is configured), never an example: the frame's Example rule reads it
 *  (lib/shell/labels.ts `exampleTagShown`), so P1's examples say Example and a published weather never does. */
export const weatherLive = fnoReader !== null;
