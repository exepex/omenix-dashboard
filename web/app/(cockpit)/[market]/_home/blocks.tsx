// Home's block loaders (story W9): server components, one per section, each reading only its own blocks through the
// HomeData interface (lib/home/wiring.ts, the one place an adapter is chosen) and handing typed blocks to the client
// sections. Each sits in its own Suspense boundary, so a slow block delays only its section, and a failed read shows
// that section's state (no data with its reason, another contract version, or an error without the error's text) while
// the rest of Home works (components/blocks/block-section.tsx).
import { blockSection } from "../../../../components/blocks/block-section.tsx";
import { Glance, MarketBand } from "../../../../components/home/glance.tsx";
import { ComingUp, NeedsYou, TopNewsList } from "../../../../components/home/home-lists.tsx";
import { OpenTrades } from "../../../../components/home/open-trades.tsx";
import { WhoTrades } from "../../../../components/home/who-trades.tsx";
import type { Market } from "../../../../lib/data/constants.ts";
import { comingUp } from "../../../../lib/home/events.ts";
import { settle, type Part } from "../../../../lib/ui/block-outcome.ts";
import { homeData, homeLive } from "../../../../lib/home/wiring.ts";

export const GlanceBlock = ({ market }: { market: Market }) =>
  blockSection("Today at a glance", () => Promise.all([homeData.accounts(market), homeData.attention(market)]), ([accounts, attention]) => <Glance accounts={accounts} needs={attention.attention.length} />);

// The session is India's F&O block (W9-F&O): read on its own, so a missing one leaves its reason and the stock parts
// beside it still show.
const sessionOf = (market: Market) => settle("The session", homeData.session(market));
const valueOf = <T,>(part: Part<T>) => ("value" in part ? part.value : null);
const missingOf = (part: Part<unknown> | null) => (part && "missing" in part ? part.missing : null);

export const MarketBlock = ({ market }: { market: Market }) =>
  blockSection("Market", () => Promise.all([sessionOf(market), homeData.trackedMoves(market)]), ([session, moves]) => <MarketBand session={valueOf(session)} missing={missingOf(session)} moves={moves} />);

/** F&O books exist only in India: in the US the read is never made, so no F&O element can appear. */
export const WhoTradesBlock = ({ market, fno }: { market: Market; fno: boolean }) =>
  blockSection(
    "Who trades",
    () => Promise.all([homeData.groups(market), fno ? settle("The F&O books", homeData.fnoBooks()) : Promise.resolve(null), homeData.accounts(market), homeData.positions(market)]),
    ([groups, books, accounts, positions]) => (
      <WhoTrades groups={groups} books={books ? (valueOf(books)?.books ?? []) : null} booksMissing={missingOf(books)} accounts={accounts} positions={positions} />
    ),
  );

export const TradesBlock = ({ market }: { market: Market }) =>
  blockSection("Open paper trades", () => Promise.all([homeData.positions(market), homeData.strategyTrades(market), sessionOf(market)]), ([positions, trades, session]) => (
    <OpenTrades positions={positions} trades={trades} sessionDate={valueOf(session)?.session_date ?? null} />
  ));

/** In India "Coming up" adds the F&O tool's expiry dates; the US never reads them (no F&O element). */
export const ListsBlock = ({ market }: { market: Market }) =>
  blockSection(
    "Needs you, coming up and news",
    () => Promise.all([homeData.attention(market), homeData.events(market), market === "india" ? settle("The F&O expiry dates", homeData.fnoEvents()) : Promise.resolve(null), homeData.topNews(market), sessionOf(market)]),
    ([attention, events, fno, news, session]) => (
    <div className="trio sec">
      <NeedsYou attention={attention} />
      <ComingUp rows={comingUp(events, homeLive.stock, fno ? (valueOf(fno) ?? { events: [] }) : null, homeLive.fno)} fnoMissing={missingOf(fno)} sessionDate={valueOf(session)?.session_date ?? null} />
      <TopNewsList news={news} />
    </div>
    ),
  );
