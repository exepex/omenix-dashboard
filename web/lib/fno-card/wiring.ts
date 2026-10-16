// The one place today's card's adapter is chosen (story W3f): the F&O publication when the database is configured,
// else P1's examples, loaded only then (lib/data/lazy.ts).
import { lazyAdapter } from "../data/lazy.ts";
import { fnoReader } from "../fno/wiring.ts";
import { azureCardData } from "./azure-source.ts";
import type { CardData } from "./source.ts";

export const cardData: CardData = fnoReader ? azureCardData(fnoReader) : lazyAdapter(() => import("./fixture-source.ts").then((m) => m.fixtureCardData));

/** The card is the publication's (a database is configured), never an example: the frame's Example rule reads it. */
export const cardLive = fnoReader !== null;
