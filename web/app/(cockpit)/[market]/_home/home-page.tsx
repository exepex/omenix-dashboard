// Home (story W9; the owner's signed-off mockup design/mockups/31-dashboard, 13 Oct 2026; its notes.md is the frozen
// contract), in the order a user asks: how am I doing, what is the market doing, what could I buy, who trades and how
// is it going, what is open, what needs me, what is coming. Each section loads its own blocks (blocks.tsx).
import { Suspense, type ReactNode } from "react";
import { HomeFooter } from "../../../../components/home/home-footer.tsx";
import { HomePicks } from "../../../../components/home/home-picks.tsx";
import { LoadingState } from "../../../../components/ui/states.tsx";
import type { Market } from "../../../../lib/data/constants.ts";
import { FreshnessBlock } from "../_fno/freshness-block.tsx";
import { GlanceBlock, ListsBlock, MarketBlock, TradesBlock, WhoTradesBlock } from "./blocks.tsx";
import "./home.css";

const Part = ({ label, children }: { label: string; children: ReactNode }) => <Suspense fallback={<LoadingState label={`Loading ${label}`} cards={1} />}>{children}</Suspense>;

export function HomePage({ market }: { market: Market }) {
  const fno = market === "india";
  return (
    <div className="home">
      <h1 className="vh">Home</h1>
      <Part label="today at a glance"><GlanceBlock market={market} /></Part>
      <Part label="the market"><MarketBlock market={market} /></Part>
      {fno ? <Part label="how current the F&O data is"><FreshnessBlock /></Part> : null}
      <HomePicks />
      <Part label="who trades"><WhoTradesBlock market={market} fno={fno} /></Part>
      <Part label="open paper trades"><TradesBlock market={market} /></Part>
      <Part label="what needs you"><ListsBlock market={market} /></Part>
      <HomeFooter />
    </div>
  );
}
