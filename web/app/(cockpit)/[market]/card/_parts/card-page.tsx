// Today's card's layout (story W3f; 39-trade-card 9-mount.js): the head, how current the F&O data is, then the card
// read once through the CardData interface (lib/fno-card/wiring.ts chooses the adapter): the verdict and its times,
// the position beside why and how sure, and every forecast on record. PAPER ONLY; the examples say Example through
// the frame's rule.
import { blockSection } from "../../../../../components/blocks/block-section.tsx";
import { ExampleTag } from "../../../../../components/frame/parts.tsx";
import { Part } from "../../../../../components/blocks/part.tsx";
import { FramePageHead } from "../../../../../components/ui/frame-page-head.tsx";
import { Icon } from "../../../../../components/ui/icon.tsx";
import { PaperTag } from "../../../../../components/ui/primitives.tsx";
import { CardPosition } from "../../../../../components/fno-card/card-position.tsx";
import { CardFooter, CardMisses, CardOnRecord, CardStayOut, CardStress, CardTradesSoFar } from "../../../../../components/fno-card/card-record.tsx";
import { CardTimes, CardVerdict } from "../../../../../components/fno-card/card-top.tsx";
import { CardAdvocate, CardChecks, CardEvidence, CardForecast, CardWeather } from "../../../../../components/fno-card/card-why.tsx";
import { cardData, cardLive } from "../../../../../lib/fno-card/wiring.ts";
import { FreshnessBlock } from "../../_fno/freshness-block.tsx";
import "../../../../../components/fno-common/fno-screen.css";
import "./card.css";

const LEDE = "Every trading day, after the day’s decisions are final, the desk sends one card: a paper trade, no trade with the reason, or a shadow to watch. It says how much the trade can lose, why, how sure the forecast is, and what would prove it wrong. Paper only: no card ever asks you to place a real order.";

const CardBlock = () =>
  blockSection("Today’s card", () => cardData.card(), (c) => (
    <>
      <CardVerdict c={c} />
      <CardTimes c={c} />
      <div className="cols">
        <div className="stack"><CardPosition c={c} /></div>
        <div className="stack">
          <CardWeather c={c} /><CardForecast c={c} /><CardAdvocate c={c} /><CardChecks c={c} /><CardEvidence c={c} />
          <CardTradesSoFar c={c} /><CardStress c={c} /><CardStayOut c={c} /><CardMisses c={c} /><CardFooter c={c} />
        </div>
      </div>
      <div className="stack"><CardOnRecord c={c} /></div>
    </>
  ));

export function CardPage() {
  const meta = (
    <>
      <span className="md-chip small"><Icon name="public" />India · F&amp;O · NIFTY</span>
      <PaperTag label="PAPER ONLY" />
      <ExampleTag item={{ live: cardLive }} />
    </>
  );
  return (
    <div className="fno-screen trade-card">
      <FramePageHead crumbs={["Strategies", "Today's card"]} title="Today's card" meta={meta} />
      <p className="lede">{LEDE}</p>
      <Part label="how current the data is"><FreshnessBlock /></Part>
      <Part label="today’s card"><CardBlock /></Part>
      <div className="src" role="note" aria-label="Where the figures come from">
        <span className="mb-asof" data-tip="exepex/trading's F&O publication, page card (T1's card record)"><Icon name="schedule" />F&amp;O publication: card</span>
        <span className="mb-tag" data-tip="Once a session day, after the day's decisions are final (the card's own times are on it); the page shows the previous session until the next morning's publish.">Not live</span>
      </div>
    </div>
  );
}
