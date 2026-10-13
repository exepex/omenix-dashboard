// The one place that picks Home's data adapter (stories W9, W9-F&O): the stock blocks are the labelled examples until
// the stock tool publishes; with the F&O database configured, the F&O blocks (India's session, the F&O books, the F&O
// expiry events) come from the F&O publication. Only the market page's block loaders read it
// (lib/home/tests/import-graph.test.ts enforces both).
import { fnoReader } from "../fno/wiring.ts";
import { fnoHomeData } from "./azure-source.ts";
import { fixtureHomeData } from "./fixture-source.ts";
import type { HomeData } from "./source.ts";

export const homeData: HomeData = fnoReader ? fnoHomeData(fnoReader, fixtureHomeData) : fixtureHomeData;

/** Which of Home's two publishers are read live: the page labels the example rows when only one is. */
export const homeLive = { stock: false, fno: fnoReader !== null } as const;
