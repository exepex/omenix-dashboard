// The one place that picks Home's data adapter (story W9). Swapping it is this one line; only the market page's block
// loaders read it (lib/home/tests/import-graph.test.ts enforces both).
import { fixtureHomeData } from "./fixture-source.ts";
import type { HomeData } from "./source.ts";

export const homeData: HomeData = fixtureHomeData;
