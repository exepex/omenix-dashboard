// The Forecast lab's layout (story W3b; 37-forecasts 9-mount.js): the head, how current the F&O data is, then the lab
// read once through the ForecastLabData interface (lib/fno-forecast-lab/wiring.ts chooses the adapter): the standing
// line first, today, who beats the yardstick, each question, who forecasts. No page yet is shown as such, never as an
// example; the examples (no database) say Example through the frame's rule.
import { blockSection } from "../../../../../components/blocks/block-section.tsx";
import { Part } from "../../../../../components/blocks/part.tsx";
import { LabBest, LabForecasters, LabToday, Standing } from "../../../../../components/fno-forecast-lab/lab-overview.tsx";
import { LabQuestions } from "../../../../../components/fno-forecast-lab/lab-questions.tsx";
import { ExampleTag } from "../../../../../components/frame/parts.tsx";
import { FramePageHead } from "../../../../../components/ui/frame-page-head.tsx";
import { Icon } from "../../../../../components/ui/icon.tsx";
import { forecastLabData, forecastLabLive } from "../../../../../lib/fno-forecast-lab/wiring.ts";
import { FreshnessBlock } from "../../_fno/freshness-block.tsx";
import "../../../../../components/fno-common/fno-screen.css";
import "./forecast-lab.css";

const LEDE = "Every forecaster answers the same questions each day before the deadline. Each is scored against a fixed yardstick, so you can see who reads the market better than plain history.";

const LabBlock = () =>
  blockSection("The Forecast lab", () => forecastLabData.lab(), (lab) => (
    <>
      <Standing lab={lab} />
      <div className="stack"><LabToday lab={lab} /><LabBest lab={lab} /><LabQuestions lab={lab} /><LabForecasters lab={lab} /></div>
    </>
  ));

export function ForecastLabPage() {
  const meta = (
    <>
      <span className="md-chip small"><Icon name="public" />India · F&amp;O</span>
      <ExampleTag item={{ live: forecastLabLive }} />
    </>
  );
  return (
    <div className="fno-screen forecast-lab">
      <FramePageHead crumbs={["Strategies", "Forecast lab"]} title="Forecast lab" meta={meta} />
      <p className="lede">{LEDE}</p>
      <Part label="how current the data is"><FreshnessBlock /></Part>
      <Part label="the Forecast lab"><LabBlock /></Part>
      <div className="src" role="note" aria-label="Where the figures come from">
        <span className="mb-asof" data-tip="exepex/trading's F&O publication, page forecast_lab (the forecast records and score reports, G3-G8)"><Icon name="schedule" />F&amp;O publication: forecast_lab</span>
        <span className="mb-tag" data-tip="After each NSE session's close; today's forecasts after the 15:00 cutoff, shown the next morning.">Not live</span>
      </div>
    </div>
  );
}
