// Fixture adapter of today's card (story W3f): P1's contract examples (api/examples/fno-screens.json, copied by
// tools/sync-design.mjs), served only without a database and labelled Example on the page. The empty case by default,
// as mockup 39: the shape of today's real state (no strategy has passed).
import raw from "../fixtures/fno-screens.generated.json" with { type: "json" };
import { exampleReader } from "../fixtures/examples.ts";
import type { FnoCard } from "./contract.ts";
import type { CardData } from "./source.ts";

/** Strategy versions carry display names only (the contract never sends a backend id), so no strategy-name rule. */
const read = exampleReader(raw, { strategies: false });

export const CARD_EXAMPLES = ["getFnoCard_india_none", "getFnoCard_india_trade", "getFnoCard_india_watch", "getFnoCard_india_red", "getFnoCard_india_missing", "getFnoCard_india_withheld"] as const;

export const fixtureCardData: CardData = { card: async () => read<FnoCard>(CARD_EXAMPLES[0]) };

/** Every example state, for the tests (good, bad and empty). */
export const cardExample = (name: (typeof CARD_EXAMPLES)[number]) => read<FnoCard>(name);
