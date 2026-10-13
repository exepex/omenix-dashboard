// Home's block loaders (story W9): server components, one per section, each reading only its own blocks through the
// HomeData interface (lib/home/wiring.ts, the one place an adapter is chosen) and handing typed blocks to the client
// sections. Each sits in its own Suspense boundary, so a slow block delays only its section, and a failed read shows
// that section's error state while the rest of Home works.
import type { ReactNode } from "react";
import { Glance, MarketBand } from "../../../../components/home/glance.tsx";
import { ComingUp, NeedsYou, TopNewsList } from "../../../../components/home/home-lists.tsx";
import { OpenTrades } from "../../../../components/home/open-trades.tsx";
import { WhoTrades } from "../../../../components/home/who-trades.tsx";
import { ErrorState } from "../../../../components/ui/states.tsx";
import type { Market } from "../../../../lib/data/constants.ts";
import { homeData } from "../../../../lib/home/wiring.ts";

/** Reads a section's blocks; a failed read becomes the section's error state, never a broken page. */
async function section<T>(what: string, read: () => Promise<T>, render: (blocks: T) => ReactNode): Promise<ReactNode> {
  let blocks: T;
  try {
    blocks = await read();
  } catch {
    return <ErrorState problem={{ title: `${what}: data not available`, status: 503, detail: "This part of Home could not be read; the rest of the page works." }} />;
  }
  return render(blocks);
}

export const GlanceBlock = ({ market }: { market: Market }) =>
  section("Today at a glance", () => Promise.all([homeData.accounts(market), homeData.attention(market)]), ([accounts, attention]) => <Glance accounts={accounts} needs={attention.attention.length} />);

export const MarketBlock = ({ market }: { market: Market }) =>
  section("Market", () => Promise.all([homeData.session(market), homeData.trackedMoves(market)]), ([session, moves]) => <MarketBand session={session} moves={moves} />);

/** F&O books exist only in India: in the US the read is never made, so no F&O element can appear. */
export const WhoTradesBlock = ({ market, fno }: { market: Market; fno: boolean }) =>
  section(
    "Who trades",
    () => Promise.all([homeData.groups(market), fno ? homeData.fnoBooks() : Promise.resolve(null), homeData.accounts(market), homeData.positions(market)]),
    ([groups, books, accounts, positions]) => <WhoTrades groups={groups} books={books ? books.books : null} accounts={accounts} positions={positions} />,
  );

export const TradesBlock = ({ market }: { market: Market }) =>
  section("Open paper trades", () => Promise.all([homeData.positions(market), homeData.strategyTrades(market), homeData.session(market)]), ([positions, trades, session]) => (
    <OpenTrades positions={positions} trades={trades} sessionDate={session.session_date} />
  ));

export const ListsBlock = ({ market }: { market: Market }) =>
  section("Needs you, coming up and news", () => Promise.all([homeData.attention(market), homeData.events(market), homeData.topNews(market), homeData.session(market)]), ([attention, events, news, session]) => (
    <div className="trio sec">
      <NeedsYou attention={attention} />
      <ComingUp events={events} sessionDate={session.session_date} />
      <TopNewsList news={news} />
    </div>
  ));
