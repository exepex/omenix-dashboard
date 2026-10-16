// The Forecast lab's data interface (story W3b): one read, the lab's page.
import type { FnoForecastLab } from "./contract.ts";

export interface ForecastLabData {
  lab(): Promise<FnoForecastLab>;
}
