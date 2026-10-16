// Today's card on exepex/trading's F&O publication (story W3f): page `card`. No page yet is the empty state with its
// reason (lib/fno/blocks.ts), never an example.
import { payloadsOf, type FnoBlockReader } from "../fno/blocks.ts";
import { FNO_PAGES } from "../fno/pages.ts";
import type { FnoCard } from "./contract.ts";
import type { CardData } from "./source.ts";

export function azureCardData(reader: FnoBlockReader): CardData {
  const payload = payloadsOf(reader);
  return { card: () => payload<FnoCard>(FNO_PAGES.getFnoCard) };
}
