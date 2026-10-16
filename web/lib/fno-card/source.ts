// Today's card's data interface (story W3f): one read, the page `card`.
import type { FnoCard } from "./contract.ts";

export interface CardData {
  card(): Promise<FnoCard>;
}
