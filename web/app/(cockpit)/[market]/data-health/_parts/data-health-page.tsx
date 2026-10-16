// The F&O data health's layout (story W3e; 44-data-health 9-mount.js): the head, how current the F&O data is, then the
// runs and the sources, read once through the DataHealthData interface (lib/fno-data-health/wiring.ts chooses the
// adapter). The examples say Example through the frame's rule.
import { blockSection } from "../../../../../components/blocks/block-section.tsx";
import { ExampleTag } from "../../../../../components/frame/parts.tsx";
import { Part } from "../../../../../components/blocks/part.tsx";
import { FramePageHead } from "../../../../../components/ui/frame-page-head.tsx";
import { Icon } from "../../../../../components/ui/icon.tsx";
import { HealthRuns } from "../../../../../components/fno-data-health/data-health-runs.tsx";
import { HealthHolds } from "../../../../../components/fno-data-health/data-health-holds.tsx";
import { HealthSources } from "../../../../../components/fno-data-health/data-health-sources.tsx";
import { dataHealthData, dataHealthLive } from "../../../../../lib/fno-data-health/wiring.ts";
import { FreshnessBlock } from "../../_fno/freshness-block.tsx";
import { HeldBlock, HoldsBlock } from "../../_fno/held-block.tsx";
import "../../../../../components/fno-common/fno-screen.css";
import "./data-health.css";

const LEDE = "Did today’s data arrive? Each F&O data source, the morning publish and the evening health check. Only dates, counts and statuses: never the data itself.";

const HealthBlock = () =>
  blockSection("The F&O data health", () => dataHealthData.health(), (h) => (
    <>
      <HealthRuns h={h} />
      <div className="stack"><HealthSources h={h} /></div>
    </>
  ));

export function DataHealthPage() {
  const meta = (
    <>
      <span className="md-chip small"><Icon name="public" />India · F&amp;O</span>
      <ExampleTag item={{ live: dataHealthLive }} />
    </>
  );
  return (
    <div className="fno-screen data-health">
      <FramePageHead crumbs={["Control", "Data health"]} title="Data health" meta={meta} />
      <p className="lede">{LEDE}</p>
      <Part label="how current the data is"><FreshnessBlock /></Part>
      <Part label="the F&O data health"><HeldBlock pageKey="data_health"><HealthBlock /></HeldBlock></Part>
      <Part label="pages held back"><HoldsBlock render={(holds) => <div className="stack"><HealthHolds holds={holds} /></div>} /></Part>
      <div className="src" role="note" aria-label="Where the figures come from">
        <span className="mb-asof" data-tip="exepex/trading's F&O publication, page data_health (the data manifests, P7's run status and O8's health check)"><Icon name="schedule" />F&amp;O publication: data health</span>
        <span className="mb-tag" data-tip="Daily, at the 07:10 IST publish.">Not live</span>
      </div>
    </div>
  );
}
