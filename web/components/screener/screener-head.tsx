"use client";
// The Screener's head (story W12; 33 notes rows 1, 2 and 12): the title with the data's source and day, the Stocks and
// F&O tabs with their counts (F&O India only: absent in the US), and the note on where the figures come from.
import type { ScreenerState } from "../../lib/screener/state.ts";
import { dateShort } from "../../lib/shell/clock.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { useFrame } from "../frame/frame-context.tsx";
import { FramePageHead } from "../ui/frame-page-head.tsx";
import { Icon } from "../ui/icon.tsx";
import { useScreenerNav } from "./controls.tsx";

const STOCKS_SOURCE = { india: "NSE’s daily equity file (BhavCopy) and security-wise delivery file", us: "The stock tool’s daily prices of the 20 companies it follows" };

/** "NSE data · Mon 12 Oct" (the day of the rows). */
function DayTag({ asOf }: { asOf: string }) {
  const { shell, market } = useFrame();
  return <span className="mb-tag" data-tip={STOCKS_SOURCE[market]}>{`${market === "india" ? "NSE" : "Stock tool"} data · ${dateShort(asOf, shell)}`}</span>;
}

export function ScreenerHead({ state, asOf, stocksN, fnoN, locale }: { state: ScreenerState; asOf: string; stocksN: { n: number; src: string }; fnoN: number | null; locale: string }) {
  const to = useScreenerNav(state);
  return (
    <>
      <FramePageHead crumbs={["Trade", "Screener"]} title="Screener" meta={<DayTag asOf={asOf} />} />
      {fnoN !== null ? (
        <div className="md-segmented dense tabs" role="group" aria-label="What to screen">
          <button type="button" aria-pressed={state.tab === "stocks"} onClick={() => to({ tab: "stocks", page: 1 })} data-src={stocksN.src}>{`Stocks (${stocksN.n.toLocaleString(locale)})`}</button>
          <button type="button" aria-pressed={state.tab === "fno"} onClick={() => to({ tab: "fno", page: 1 })} data-src={sourceName("fnoSummary", "n")}>{`F&O (${fnoN.toLocaleString(locale)})`}</button>
        </div>
      ) : null}
    </>
  );
}

/** Where the figures come from: the files and the day, what is ours, what the tools cover, and that nothing is live. */
export function SourcesNote({ tab, asOf, horizon }: { tab: "stocks" | "fno"; asOf: string; horizon?: number }) {
  const { shell, market } = useFrame();
  const day = dateShort(asOf, shell);
  if (tab === "fno") {
    return (
      <div className="src" role="note" aria-label="Where the figures come from">
        <span className="mb-asof" data-tip="NSE’s daily F&O file: the nearest monthly future and the at-the-money call and put"><Icon name="schedule" />{`NSE F&O close of ${day}`}</span>
        <span className="mb-tag derived" data-tip="ATM IV: Black-Scholes on the at-the-money call and put closes, only when they traded (rate 6.5%, no dividend), as the F&O tool computes. Build-up, put-call ratio and the move priced in: from the NSE file.">IV and readings: ours</span>
        <span className="mb-tag" data-tip="No streaming prices: the screener changes with each day’s NSE file.">Not live</span>
      </div>
    );
  }
  return (
    <div className="src" role="note" aria-label="Where the figures come from">
      <span className="mb-asof" data-tip={STOCKS_SOURCE[market]}><Icon name="schedule" />{`Prices: close of ${day}`}</span>
      {market === "india" ? <span className="mb-asof" data-tip="NSE’s Nifty 500 list (industries; only Nifty 500 stocks have one)"><Icon name="info" />Sectors: Nifty 500 list</span> : null}
      <span className="mb-tag derived" data-tip="Returns, 52-week position, volume against its usual and RSI 14: computed by us from the daily closes">Computed: ours</span>
      <span className="mb-asof" data-tip={`Strategies and model: the stock tool’s records, for the next ${horizon ?? 5} sessions`}><Icon name="science" />Our tools: followed companies only</span>
      <span className="mb-tag" data-tip="No streaming prices: the screener changes with each day’s close.">Not live</span>
    </div>
  );
}
