// The Screener's block loaders (story W12): server components, one per part, each reading only its W11 blocks through
// the ScreenerData interface (lib/screener/wiring.ts, the one place an adapter is chosen) and handing typed blocks to
// the client parts. The US never reads an F&O block (absent, not empty).
import { FnoLook, FnoResults } from "../../../../../components/screener/fno-tab.tsx";
import { ScreenerHead, SourcesNote } from "../../../../../components/screener/screener-head.tsx";
import { StocksLook } from "../../../../../components/screener/stocks-look.tsx";
import { StocksTable } from "../../../../../components/screener/stocks-table.tsx";
import { blockSection } from "../../../../../components/blocks/block-section.tsx";
import type { Market } from "../../../../../lib/data/constants.ts";
import { fnoQuery, stocksQuery, type ScreenerState } from "../../../../../lib/screener/state.ts";
import { screenerData } from "../../../../../lib/screener/wiring.ts";

const localeOf = (market: Market) => (market === "india" ? "en-IN" : "en-US");

export const HeadBlock = ({ market, state }: { market: Market; state: ScreenerState }) =>
  blockSection("The screener", () => Promise.all([screenerData.summary(market), market === "india" ? screenerData.fnoSummary() : Promise.resolve(null)]), ([summary, fno]) => {
    const uni = market === "india" ? "all" : "ours";
    const n = summary.universes[uni]?.n ?? 0;
    return <ScreenerHead state={state} asOf={summary.as_of} stocksN={{ n, src: `summary:universes.${uni}.n` }} fnoN={fno ? fno.n : null} locale={localeOf(market)} />;
  });

export const StocksLookBlock = ({ market, state }: { market: Market; state: ScreenerState }) =>
  blockSection("Today in one look", () => Promise.all([screenerData.summary(market), screenerData.tools(market)]), ([summary, tools]) => (
    <StocksLook state={state} summary={summary} tools={tools} india={market === "india"} locale={localeOf(market)} />
  ));

export const ResultsBlock = ({ market, state }: { market: Market; state: ScreenerState }) =>
  blockSection(
    "The results",
    async () => {
      const tools = await screenerData.tools(market);
      return [tools, await screenerData.stocks(market, stocksQuery(state, tools))] as const;
    },
    ([tools, stocks]) => (
      <>
        <StocksTable state={state} stocks={stocks} tools={tools} india={market === "india"} locale={localeOf(market)} />
        <SourcesNote tab="stocks" asOf={stocks.as_of} horizon={tools.horizon_days} />
      </>
    ),
  );

export const FnoLookBlock = ({ state }: { state: ScreenerState }) => blockSection("Futures build-up", () => screenerData.fnoSummary(), (summary) => <FnoLook state={state} summary={summary} />);

export const FnoResultsBlock = ({ state }: { state: ScreenerState }) =>
  blockSection("The F&O rows", () => Promise.all([screenerData.fnoSummary(), screenerData.fnoRows(fnoQuery(state))]), ([summary, rows]) => (
    <>
      <FnoResults state={state} summary={summary} rows={rows} />
      <SourcesNote tab="fno" asOf={rows.as_of} />
    </>
  ));
