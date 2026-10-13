// Fixture adapter of the Markets overview (story W12): W11's own contract examples (api/examples/blocks-33-34.json,
// from the signed-off 34-markets records), and the frame's session block from W10's examples. A real adapter (the F&O tool's NSE ingest, the stock tool) replaces this one
// in wiring.ts.
import raw from "../fixtures/blocks-33-34.generated.json" with { type: "json" };
import frameRaw from "../fixtures/blocks.generated.json" with { type: "json" };
import { exampleReader } from "../fixtures/examples.ts";
import type { OverviewData } from "./source.ts";

const read = exampleReader(raw);
/** The frame's blocks (W10's examples). */
const readFrame = exampleReader(frameRaw);

export const fixtureOverviewData: OverviewData = {
  session: async (market) => readFrame(`getSession_${market}`),
  indices: async (market) => read(market === "india" ? "getOverviewIndicesIndia_india" : "getOverviewIndicesUs_us"),
  indiaSectors: async () => read("getIndiaSectors_india"),
  usSectors: async () => read("getUsSectors_us"),
  flows: async () => read("getFlows_india"),
  rates: async () => read("getRates_us"),
  world: async (market) => read(`getWorld_${market}`),
  events: async (market) => read(`getEvents_${market}_markets`),
};
