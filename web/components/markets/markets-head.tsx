"use client";
// The Markets overview's head and foot (story W12; 34 notes rows 1, 2 and 13): the title with the data's source and day
// and the stock tool's session reading, the period switch, and the note on where the figures come from.
import type { MarketsState } from "../../lib/overview/state.ts";
import { PERIOD_LABEL, REGIME } from "../../lib/overview/view.ts";
import { PERIODS } from "../../lib/screener/contract.ts";
import { dateShort } from "../../lib/shell/clock.ts";
import { useFrame } from "../frame/frame-context.tsx";
import { Segmented } from "../ui/controls.tsx";
import { FramePageHead } from "../ui/frame-page-head.tsx";
import { Icon } from "../ui/icon.tsx";
import { useMarketsNav } from "./nav.tsx";

const SOURCES = {
  india: [["Indices", "NSE’s daily index file (close, change, P/E, P/B, dividend yield)"], ["Stocks", "NSE’s daily equity file (breadth and movers)"], ["World", "The stock tool’s daily closes of world markets, currencies and commodities"], ["Flows", "The stock tool’s FII/DII (NSE, provisional) and NSDL FPI records"], ["Events", "The stock tool’s calendar and NSE’s F&O expiries"]],
  us: [["Indices", "The stock tool’s daily closes of the S&P 500 fund and the VIX"], ["Stocks", "The stock tool’s 20 US companies"], ["World", "The stock tool’s daily closes of world markets, currencies and commodities"], ["Events", "The stock tool’s calendar"], ["Yields", "The stock tool’s Treasury par yields (treasury.gov)"]],
} as const;

export function MarketsHead({ state, asOf, regime }: { state: MarketsState; asOf: string; regime: string | null }) {
  const { shell, market } = useFrame();
  const to = useMarketsNav(state);
  const meta = (
    <>
      <span className="mb-tag" data-tip={SOURCES[market][0][1]}>{`${market === "india" ? "NSE" : "Stock tool"} data · ${dateShort(`${asOf}T10:00:00Z`, shell)}`}</span>
      {regime ? <span className="md-chip" data-tip="The stock tool’s reading of the session"><Icon name="sensors" />{REGIME[regime] ?? regime}</span> : null}
    </>
  );
  return (
    <>
      <FramePageHead crumbs={["Markets", "Overview"]} title="Markets" meta={meta} />
      <div className="bar">
        <span className="muted small">Change over</span>
        <Segmented label="Change over" options={PERIODS.map((p) => ({ value: p, label: PERIOD_LABEL[p] }))} value={state.per} onChange={(per) => to({ per })} light={false} />
      </div>
    </>
  );
}

export function MarketsSources() {
  const { market } = useFrame();
  return (
    <div className="src" role="note" aria-label="Where the figures come from">
      {SOURCES[market].map(([k, tip]) => <span key={k} className="mb-asof" data-tip={tip}><Icon name="schedule" />{k}</span>)}
      <span className="mb-tag derived" data-tip="Returns, 52-week figures, breadth and the industry averages: computed by us from the daily closes">Computed: ours</span>
      <span className="mb-tag" data-tip="No streaming prices: the page changes with each day’s files.">Not live</span>
    </div>
  );
}
