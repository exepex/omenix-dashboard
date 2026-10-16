// The market weather's layout (story W3a; 40-weather 9-mount.js): the head, how current the F&O data is, then today's
// weather read once through the WeatherData interface (lib/fno-weather/wiring.ts chooses the adapter). No page yet is
// shown as such, never as an example; the examples (no database) say Example through the frame's rule.
import { blockSection } from "../../../../../components/blocks/block-section.tsx";
import { ExampleTag } from "../../../../../components/frame/parts.tsx";
import { Part } from "../../../../../components/blocks/part.tsx";
import { FramePageHead } from "../../../../../components/ui/frame-page-head.tsx";
import { Icon } from "../../../../../components/ui/icon.tsx";
import { PaperTag } from "../../../../../components/ui/primitives.tsx";
import { WeatherPrice, WeatherRecent, WeatherRedShare, WeatherScores } from "../../../../../components/fno-weather/weather-record.tsx";
import { WeatherChances, WeatherDrivers, WeatherUpgrades, WeatherVerdict } from "../../../../../components/fno-weather/weather-top.tsx";
import { weatherData, weatherLive } from "../../../../../lib/fno-weather/wiring.ts";
import { FreshnessBlock } from "../../_fno/freshness-block.tsx";
import "./weather.css";

const LEDE = "Is today dangerous? At 15:00 every trading day the desk works out the chance of a big NIFTY move (2% or more) and turns it into a colour. RED means no new paper trade that day. It is a survival rule, not a profit signal.";

const TodayBlock = () =>
  blockSection("Today’s weather", () => weatherData.today(), (w) => (
    <>
      <WeatherVerdict w={w} />
      <div className="cols">
        <div className="stack"><WeatherRecent w={w} /><WeatherRedShare w={w} /><WeatherScores w={w} /><WeatherPrice w={w} /></div>
        <div className="stack"><WeatherChances w={w} /><WeatherDrivers w={w} /><WeatherUpgrades w={w} /></div>
      </div>
    </>
  ));

export function WeatherPage() {
  const meta = (
    <>
      <span className="md-chip small"><Icon name="public" />India · F&amp;O · NIFTY</span>
      <PaperTag label="Paper" />
      <ExampleTag item={{ live: weatherLive }} />
    </>
  );
  return (
    <div className="weather">
      <FramePageHead crumbs={["Markets", "Market weather"]} title="Market weather" meta={meta} />
      <p className="lede">{LEDE}</p>
      <Part label="how current the data is"><FreshnessBlock /></Part>
      <Part label="today’s weather"><TodayBlock /></Part>
      <div className="src" role="note" aria-label="Where the figures come from">
        <span className="mb-asof" data-tip="exepex/trading's F&O publication, page weather (story M1's weather record)"><Icon name="schedule" />F&amp;O publication: weather</span>
        <span className="mb-tag" data-tip="Once a session day at 15:00 IST; the page shows the previous session until the next morning's publish.">Not live</span>
      </div>
    </div>
  );
}
