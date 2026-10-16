// The weather history's layout (story W3a part 2; 46-weather-history 9-mount.js): the head, how current the F&O data
// is, then the history read once through the WeatherData interface (lib/fno-weather/wiring.ts chooses the adapter).
// Colour and label only: today's chances stay on the weather page. The examples say Example through the frame's rule.
import { blockSection } from "../../../../../../components/blocks/block-section.tsx";
import { ExampleTag } from "../../../../../../components/frame/parts.tsx";
import { Part } from "../../../../../../components/blocks/part.tsx";
import { FramePageHead } from "../../../../../../components/ui/frame-page-head.tsx";
import { Icon } from "../../../../../../components/ui/icon.tsx";
import { HistoryCounts, HistorySessions } from "../../../../../../components/fno-weather/weather-history.tsx";
import { weatherData, weatherLive } from "../../../../../../lib/fno-weather/wiring.ts";
import { FreshnessBlock } from "../../../_fno/freshness-block.tsx";
import "../../../../../../components/fno-common/fno-screen.css";
import "./weather-history.css";

const LEDE = "Every session’s weather colour, and whether it was made on the day or rebuilt later from history. Today’s chances of a big move are on the weather page.";

const HistoryBlock = () =>
  blockSection("The weather’s history", () => weatherData.history(), (h) => (
    <>
      <div className="stack"><HistoryCounts h={h} /></div>
      <div className="stack"><HistorySessions h={h} /></div>
    </>
  ));

export function WeatherHistoryPage() {
  const meta = (
    <>
      <span className="md-chip small"><Icon name="public" />India · F&amp;O</span>
      <ExampleTag item={{ live: weatherLive }} />
    </>
  );
  return (
    <div className="fno-screen weather-history">
      <FramePageHead crumbs={["Markets", "Market weather", "History"]} title="Weather history" meta={meta} />
      <p className="lede">{LEDE}</p>
      <Part label="how current the data is"><FreshnessBlock /></Part>
      <Part label="the weather’s history"><HistoryBlock /></Part>
      <div className="src" role="note" aria-label="Where the figures come from">
        <span className="mb-asof" data-tip="exepex/trading's F&O publication, page weather_history (story M1's weather record)"><Icon name="schedule" />F&amp;O publication: weather history</span>
        <span className="mb-tag" data-tip="Once a session day at 15:00 IST; the page shows the previous session until the next morning's publish.">Not live</span>
      </div>
    </div>
  );
}
