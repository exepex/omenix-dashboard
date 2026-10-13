// The Screener's layout (story W12): the head with the tabs, then the Stocks tab (at a glance, the screens, which stocks
// and over which period, the results) or the F&O tab (India only). Each part loads its own blocks (blocks.tsx).
import { Suspense, type ReactNode } from "react";
import { PicksHiddenHere } from "../../../../../components/frame/picks-hidden.tsx";
import { StocksBar } from "../../../../../components/screener/stocks-bar.tsx";
import { LoadingState } from "../../../../../components/ui/states.tsx";
import type { Market } from "../../../../../lib/data/constants.ts";
import type { ScreenerState } from "../../../../../lib/screener/state.ts";
import { FnoLookBlock, FnoResultsBlock, HeadBlock, ResultsBlock, StocksLookBlock } from "./blocks.tsx";
import "./screener.css";

const Part = ({ label, children }: { label: string; children: ReactNode }) => <Suspense fallback={<LoadingState label={`Loading ${label}`} cards={1} />}>{children}</Suspense>;

export function ScreenerPage({ market, state }: { market: Market; state: ScreenerState }) {
  const india = market === "india";
  return (
    <div className="screener">
      <PicksHiddenHere />
      <Part label="the screener"><HeadBlock market={market} state={state} /></Part>
      {state.tab === "fno" ? (
        <>
          <Part label="the build-ups"><FnoLookBlock state={state} /></Part>
          <Part label="the F&O rows"><FnoResultsBlock state={state} /></Part>
        </>
      ) : (
        <>
          <Part label="today in one look"><StocksLookBlock market={market} state={state} /></Part>
          <StocksBar state={state} india={india} />
          <Part label="the results"><ResultsBlock market={market} state={state} /></Part>
        </>
      )}
    </div>
  );
}
