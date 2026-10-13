// The Markets overview's block loaders (story W12): server components, one per part, each reading only its W11 blocks
// through the OverviewData and ScreenerData interfaces (their wiring files choose the adapters). India-only blocks
// (flows, VIX, index options, sector indices) are never read in the US, and the US-only rates never in India: absent,
// not empty.
import { blockSection } from "../../../../../components/blocks/block-section.tsx";
import { Breadth, Sectors } from "../../../../../components/markets/breadth-sectors.tsx";
import { Hero } from "../../../../../components/markets/hero.tsx";
import { MarketsHead } from "../../../../../components/markets/markets-head.tsx";
import { FlowsCard, Movers } from "../../../../../components/markets/movers-flows.tsx";
import { IndexOptions, Vix, Yields } from "../../../../../components/markets/vol-rates.tsx";
import { EventsCard, WorldCard } from "../../../../../components/markets/world-events.tsx";
import type { Market } from "../../../../../lib/data/constants.ts";
import { comingUp, dayAt, MARKETS_EVENTS } from "../../../../../lib/home/events.ts";
import { orAbsent } from "../../../../../lib/ui/block-states.ts";
import { settle, type Part } from "../../../../../lib/ui/block-outcome.ts";
import { EmptyState } from "../../../../../components/ui/states.tsx";
import { NoExample } from "../../../../../lib/ui/no-example.ts";
import { moversQuery, type MarketsState } from "../../../../../lib/overview/state.ts";
import { overviewData } from "../../../../../lib/overview/wiring.ts";
import { INDEX_OPTIONS } from "../../../../../lib/screener/screens.ts";
import { screenerData } from "../../../../../lib/screener/wiring.ts";

interface P {
  market: Market;
  state: MarketsState;
}
const localeOf = (market: Market) => (market === "india" ? "en-IN" : "en-US");
const valueOf = <T,>(part: Part<T> | null) => (part && "value" in part ? part.value : null);
const missingOf = (part: Part<unknown> | null) => (part && "missing" in part ? part.missing : null);

/** The movers' page, or null when no data answers that list (the card keeps its switches and says so). */
const movers = (p: P) => screenerData.stocks(p.market, moversQuery(p.state, p.market)).catch((e) => (e instanceof NoExample ? null : Promise.reject(e)));

export const HeadBlock = (p: P) =>
  blockSection("The markets", () => Promise.all([overviewData.indices(p.market), orAbsent(overviewData.session(p.market))]), ([indices, session]) => (
    <MarketsHead state={p.state} asOf={indices.indices[0].as_of} regime={session?.regime || null} />
  ));

export const HeroBlock = (p: P) => blockSection("The indices", () => overviewData.indices(p.market), (indices) => <Hero indices={indices} state={p.state} india={p.market === "india"} locale={localeOf(p.market)} />);

export const BreadthSectorsBlock = (p: P) =>
  blockSection("Breadth and sectors", () => Promise.all([screenerData.summary(p.market), p.market === "india" ? overviewData.indiaSectors() : overviewData.usSectors()]), ([summary, sectors]) => (
    <div className="two sec">
      <Breadth summary={summary} state={p.state} india={p.market === "india"} locale={localeOf(p.market)} />
      <Sectors sectors={sectors} state={p.state} locale={localeOf(p.market)} />
    </div>
  ));

export const MoversFlowsBlock = (p: P) =>
  blockSection("Movers and flows", () => Promise.all([movers(p), p.market === "india" ? overviewData.flows() : Promise.resolve(null)]), ([rows, flows]) => (
    <div className={flows ? "two sec" : "sec"}>
      <Movers movers={rows} state={p.state} india={p.market === "india"} locale={localeOf(p.market)} />
      {flows ? <FlowsCard flows={flows} state={p.state} /> : null}
    </div>
  ));

export const VolRatesBlock = (p: P) =>
  p.market === "india"
    ? blockSection("Volatility and options", () => Promise.all([overviewData.indices("india"), screenerData.fnoRows({ symbols: INDEX_OPTIONS, sort: "oi", page: 1, page_size: 25 })]), ([indices, rows]) => (
        <div className="two sec"><Vix indices={indices} state={p.state} /><IndexOptions rows={rows} /></div>
      ))
    : blockSection("Interest rates", () => overviewData.rates(), (rates) => <div className="sec"><Yields rates={rates} /></div>);

/** Each of the four reads on its own (contract 2.5): in India the stock tool's events and exepex/trading's expiries
 *  merge under the Markets query; a part with no data shows its reason while the others still show. */
const settled = (p: P) =>
  Promise.all([
    settle("The world", overviewData.world(p.market)),
    settle("Results and other events", overviewData.events(p.market)),
    p.market === "india" ? settle("NIFTY expiries", overviewData.fnoEvents()) : Promise.resolve(null),
    settle("The session", overviewData.session(p.market)),
  ]);

export const WorldEventsBlock = (p: P) =>
  blockSection("The world and what is coming", () => settled(p), ([world, stock, fno, session]) => {
    const india = p.market === "india";
    const from = valueOf(session)?.session_date ?? dayAt(new Date(), india ? 330 : -240);
    const rows = comingUp(valueOf(stock) ?? { events: [] }, false, fno ? (valueOf(fno) ?? { events: [] }) : null, true, MARKETS_EVENTS, from);
    const missing = ([["Results and other events", missingOf(stock)], ["NIFTY expiries", missingOf(fno)]] as const).flatMap(([what, m]) => (m ? [`${what}: ${m}`] : []));
    return (
      <div className="two sec">
        {"value" in world ? <WorldCard world={world.value} state={p.state} india={india} locale={localeOf(p.market)} /> : <EmptyState title="The world: no data">{world.missing}</EmptyState>}
        <EventsCard events={{ events: rows.map((r) => r.event) }} missing={missing} india={india} />
      </div>
    );
  });
