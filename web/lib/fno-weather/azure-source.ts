// The market weather on exepex/trading's F&O publication (story W3a): pages `weather` and `weather_history`. No page yet is the empty state
// with its reason (lib/fno/blocks.ts), never an example.
import { payloadsOf, type FnoBlockReader } from "../fno/blocks.ts";
import { FNO_PAGES } from "../fno/pages.ts";
import type { FnoWeather, FnoWeatherHistory } from "./contract.ts";
import type { WeatherData } from "./source.ts";

export function azureWeatherData(reader: FnoBlockReader): WeatherData {
  const payload = payloadsOf(reader);
  return { today: () => payload<FnoWeather>(FNO_PAGES.getFnoWeather), history: () => payload<FnoWeatherHistory>(FNO_PAGES.getFnoWeatherHistory) };
}
