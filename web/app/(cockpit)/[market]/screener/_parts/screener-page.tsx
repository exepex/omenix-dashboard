// The Screener's layout (story W12): the head with the tabs, then the Stocks tab (at a glance, the screens, which stocks
// and over which period, the results) or the F&O tab (India only). Each part loads its own blocks (blocks.tsx).
import { Part } from "../../../../../components/blocks/part.tsx";
import { PicksHiddenHere } from "../../../../../components/frame/picks-hidden.tsx";
import { StocksBar } from "../../../../../components/screener/stocks-bar.tsx";
import type { Market } from "../../../../../lib/data/constants.ts";
import type { ScreenerState } from "../../../../../lib/screener/state.ts";
import { FreshnessBlock } from "../../_fno/freshness-block.tsx";
import { FnoLookBlock, FnoResultsBlock, HeadBlock, ResultsBlock, StocksLookBlock } from "./blocks.tsx";
import "./screener.css";

export function ScreenerPage({ market, state }: { market: Market; state: ScreenerState }) {
  const india = market === "india";
  return (
    <div className="screener">
      <PicksHiddenHere />
      <Part label="the screener"><HeadBlock market={market} state={state} /></Part>
      {india ? <Part label="how current the data is"><FreshnessBlock /></Part> : null}
      {state.tab === "fno" ? (
        <>
          <Part label="the build-ups"><FnoLookBlock state={state} /></Part>
          <Part label="the F&O rows"><FnoResultsBlock state={state} /></Part>
        </>
      ) : (
        <>
          <Part label="today in one look"><StocksLookBlock market={market} state={state} /></Part>
          <Part label="the results" lead={<StocksBar state={state} india={india} />}><ResultsBlock market={market} state={state} /></Part>
        </>
      )}
    </div>
  );
}
