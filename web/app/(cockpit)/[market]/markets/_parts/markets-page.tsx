// The Markets overview's layout (story W12), in the order a reader asks: what did the market do, was the move broad and
// which sectors led, who moved and what big investors did, how nervous is it (India) or what rates say (US), the world
// and what is coming. Each part loads its own blocks (blocks.tsx).
import { Suspense, type ReactNode } from "react";
import { PicksHiddenHere } from "../../../../../components/frame/picks-hidden.tsx";
import { MarketsSources } from "../../../../../components/markets/markets-head.tsx";
import { LoadingState } from "../../../../../components/ui/states.tsx";
import type { Market } from "../../../../../lib/data/constants.ts";
import type { MarketsState } from "../../../../../lib/overview/state.ts";
import { FreshnessBlock } from "../../_fno/freshness-block.tsx";
import { BreadthSectorsBlock, HeadBlock, HeroBlock, MoversFlowsBlock, VolRatesBlock, WorldEventsBlock } from "./blocks.tsx";
import "./markets.css";

const Part = ({ label, children }: { label: string; children: ReactNode }) => <Suspense fallback={<LoadingState label={`Loading ${label}`} cards={1} />}>{children}</Suspense>;

export function MarketsPage({ market, state }: { market: Market; state: MarketsState }) {
  return (
    <div className="markets">
      <PicksHiddenHere />
      <Part label="the markets"><HeadBlock market={market} state={state} /></Part>
      {market === "india" ? <Part label="how current the data is"><FreshnessBlock /></Part> : null}
      <Part label="the indices"><HeroBlock market={market} state={state} /></Part>
      <Part label="breadth and sectors"><BreadthSectorsBlock market={market} state={state} /></Part>
      <Part label="movers and flows"><MoversFlowsBlock market={market} state={state} /></Part>
      <Part label={market === "india" ? "volatility and options" : "interest rates"}><VolRatesBlock market={market} state={state} /></Part>
      <Part label="the world and what is coming"><WorldEventsBlock market={market} state={state} /></Part>
      <MarketsSources />
    </div>
  );
}
