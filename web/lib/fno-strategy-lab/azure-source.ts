// The Strategy lab's F&O tab on exepex/trading's F&O publication (story W3d): page `strategy_lab`. No page yet is the
// empty state with its reason (lib/fno/blocks.ts), never an example.
import { payloadsOf, type FnoBlockReader } from "../fno/blocks.ts";
import { FNO_PAGES } from "../fno/pages.ts";
import type { FnoStrategyLab } from "./contract.ts";
import type { StrategyLabFnoData } from "./source.ts";

export function azureStrategyLabFnoData(reader: FnoBlockReader): StrategyLabFnoData {
  const payload = payloadsOf(reader);
  return { lab: () => payload<FnoStrategyLab>(FNO_PAGES.getFnoStrategyLab) };
}
