// The paper books' data interface (story W3c): one read, the page `paper_trades`.
import type { FnoPaperTrades } from "./contract.ts";

export interface PaperBooksData {
  trades(): Promise<FnoPaperTrades>;
}
