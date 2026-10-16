// The paper books on exepex/trading's F&O publication (story W3c): page `paper_trades`. No page yet is the empty state
// with its reason (lib/fno/blocks.ts), never an example.
import { payloadsOf, type FnoBlockReader } from "../fno/blocks.ts";
import { FNO_PAGES } from "../fno/pages.ts";
import type { FnoPaperTrades } from "./contract.ts";
import type { PaperBooksData } from "./source.ts";

export function azurePaperBooksData(reader: FnoBlockReader): PaperBooksData {
  const payload = payloadsOf(reader);
  return { trades: () => payload<FnoPaperTrades>(FNO_PAGES.getFnoPaperTrades) };
}
