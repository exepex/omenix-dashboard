// The F&O data health on exepex/trading's F&O publication (story W3e): page `data_health`. No page yet is the empty
// state with its reason (lib/fno/blocks.ts), never an example.
import { payloadsOf, type FnoBlockReader } from "../fno/blocks.ts";
import { FNO_PAGES } from "../fno/pages.ts";
import type { FnoDataHealth } from "./contract.ts";
import type { DataHealthData } from "./source.ts";

export function azureDataHealthData(reader: FnoBlockReader): DataHealthData {
  const payload = payloadsOf(reader);
  return { health: () => payload<FnoDataHealth>(FNO_PAGES.getFnoDataHealth) };
}
