// The F&O data health's data interface (story W3e): one read, the page `data_health`.
import type { FnoDataHealth } from "./contract.ts";

export interface DataHealthData {
  health(): Promise<FnoDataHealth>;
}
