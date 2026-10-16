// The market weather's data interface (story W3a): today's weather page, and its history (part 2, contract 2.8.0).
import type { FnoWeather, FnoWeatherHistory } from "./contract.ts";

export interface WeatherData {
  today(): Promise<FnoWeather>;
  history(): Promise<FnoWeatherHistory>;
}
