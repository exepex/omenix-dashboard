// Fixture adapter of the paper books (story W3c): P1's contract examples (api/examples/fno-screens.json, copied by
// tools/sync-design.mjs), served only without a database and labelled Example on the page. The good case by default.
import raw from "../fixtures/fno-screens.generated.json" with { type: "json" };
import { exampleReader } from "../fixtures/examples.ts";
import type { FnoPaperTrades } from "./contract.ts";
import type { PaperBooksData } from "./source.ts";

/** Strategies are named by the payload's own display names (never their rules); no strategy-name rule applies. */
const read = exampleReader(raw, { strategies: false });

export const BOOKS_EXAMPLES = ["getFnoPaperTrades_india_won", "getFnoPaperTrades_india_lost", "getFnoPaperTrades_india_none"] as const;

export const fixturePaperBooksData: PaperBooksData = { trades: async () => read<FnoPaperTrades>(BOOKS_EXAMPLES[0]) };

/** Every example state, for the tests (good, bad and empty). */
export const booksExample = (name: (typeof BOOKS_EXAMPLES)[number]) => read<FnoPaperTrades>(name);
