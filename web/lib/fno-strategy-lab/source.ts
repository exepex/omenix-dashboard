// The Strategy lab's F&O data interface (story W3d): one read, the lab's F&O page.
import type { FnoStrategyLab } from "./contract.ts";

export interface StrategyLabFnoData {
  lab(): Promise<FnoStrategyLab>;
}
