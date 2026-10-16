// The Forecast lab on exepex/trading's F&O publication (story W3b): page `forecast_lab`. No page yet is the empty state
// with its reason (lib/fno/blocks.ts), never an example.
import { payloadsOf, type FnoBlockReader } from "../fno/blocks.ts";
import { FNO_PAGES } from "../fno/pages.ts";
import type { FnoForecastLab } from "./contract.ts";
import type { ForecastLabData } from "./source.ts";

export function azureForecastLabData(reader: FnoBlockReader): ForecastLabData {
  const payload = payloadsOf(reader);
  return { lab: () => payload<FnoForecastLab>(FNO_PAGES.getFnoForecastLab) };
}
