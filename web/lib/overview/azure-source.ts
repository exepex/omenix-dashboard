// The Markets overview's adapter on the F&O product's publications (stories W2, W9-F&O; contract 2.5): India's indices,
// sector indices, session, flows and NSE F&O expiries from the current publication. Everything else on the page (the
// world, the stock tool's events, the US blocks) has no producer yet and is empty with that reason: never examples.
import { payloadsOf, type FnoBlockReader } from "../fno/blocks.ts";
import { FNO_PAGES } from "../fno/pages.ts";
import { noProducer } from "../ui/block-states.ts";
import type { OverviewData } from "./source.ts";

export function azureOverviewData(reader: FnoBlockReader): OverviewData {
  const payload = payloadsOf(reader);
  return {
    session: (market) => (market === "india" ? payload(FNO_PAGES.getSessionIndia) : noProducer()),
    indices: (market) => (market === "india" ? payload(FNO_PAGES.getOverviewIndicesIndia) : noProducer()),
    indiaSectors: () => payload(FNO_PAGES.getIndiaSectors),
    usSectors: () => noProducer(),
    flows: () => payload(FNO_PAGES.getFlows),
    rates: () => noProducer(),
    world: () => noProducer(),
    events: () => noProducer(),
    fnoEvents: () => payload(FNO_PAGES.getFnoEvents),
  };
}
