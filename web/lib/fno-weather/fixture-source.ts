// Fixture adapter of the market weather (story W3a): P1's contract examples (api/examples/fno-screens.json, copied by
// tools/sync-design.mjs), served only without a database and labelled Example on the page. The good case by default.
import raw from "../fixtures/fno-screens.generated.json" with { type: "json" };
import { exampleReader } from "../fixtures/examples.ts";
import type { FnoWeather, FnoWeatherHistory } from "./contract.ts";
import type { WeatherData } from "./source.ts";

/** Market data only: no strategy names, so no display-name rule. */
const read = exampleReader(raw, { strategies: false });

export const WEATHER_EXAMPLES = ["getFnoWeather_india_green", "getFnoWeather_india_red", "getFnoWeather_india_missing"] as const;

export const HISTORY_EXAMPLES = ["getFnoWeatherHistory_india_calm", "getFnoWeatherHistory_india_stormy", "getFnoWeatherHistory_india_none"] as const;

export const fixtureWeatherData: WeatherData = { today: async () => read<FnoWeather>(WEATHER_EXAMPLES[0]), history: async () => read<FnoWeatherHistory>(HISTORY_EXAMPLES[0]) };

/** Every example state, for the tests (good, bad and empty). */
export const weatherExample = (name: (typeof WEATHER_EXAMPLES)[number]) => read<FnoWeather>(name);

export const historyExample = (name: (typeof HISTORY_EXAMPLES)[number]) => read<FnoWeatherHistory>(name);
