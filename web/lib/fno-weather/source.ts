// The market weather's data interface (story W3a): one read, today's weather page.
import type { FnoWeather } from "./contract.ts";

export interface WeatherData {
  today(): Promise<FnoWeather>;
}
