// The Strategy lab's F&O tab, its layout (story W3d; 45-strategy-lab-fno 9-mount.js): the head with the two tabs, how
// current the F&O data is, then the lab read once through the StrategyLabFnoData interface (its wiring chooses the
// adapter): the headline, every idea tried, the books, the paper results and the real-money checks. No page yet is
// shown as such, never as an example; the examples (no database) say Example through the frame's rule.
import { blockSection } from "../../../../../../components/blocks/block-section.tsx";
import { Part } from "../../../../../../components/blocks/part.tsx";
import { LabTabs } from "../../../../../../components/fno-common/lab-tabs.tsx";
import { LabFnoFactory, LabFnoHeadline } from "../../../../../../components/fno-strategy-lab/lab-fno-factory.tsx";
import { LabFnoBooks, LabFnoRealMoney, LabFnoResults } from "../../../../../../components/fno-strategy-lab/lab-fno-results.tsx";
import { ExampleTag } from "../../../../../../components/frame/parts.tsx";
import { FramePageHead } from "../../../../../../components/ui/frame-page-head.tsx";
import { Icon } from "../../../../../../components/ui/icon.tsx";
import { PaperTag } from "../../../../../../components/ui/primitives.tsx";
import { strategyLabFnoData, strategyLabFnoLive } from "../../../../../../lib/fno-strategy-lab/wiring.ts";
import { FreshnessBlock } from "../../../_fno/freshness-block.tsx";
import "../../../../../../components/fno-common/fno-screen.css";

const LEDE = "Which F&O strategies passed their test, which books may trade them, and what they made on paper after every cost. The stock tab is separate and never combined with this one.";

const LabBlock = () =>
  blockSection("The Strategy lab: F&O", () => strategyLabFnoData.lab(), (lab) => (
    <>
      <LabFnoHeadline lab={lab} />
      <div className="stack"><LabFnoFactory lab={lab} /><LabFnoBooks lab={lab} /><LabFnoResults lab={lab} /><LabFnoRealMoney lab={lab} /></div>
    </>
  ));

export function StrategyLabFnoPage() {
  const meta = (
    <>
      <span className="md-chip small"><Icon name="public" />India · F&amp;O</span>
      <PaperTag label="Paper" />
      <ExampleTag item={{ live: strategyLabFnoLive }} />
    </>
  );
  return (
    <div className="fno-screen">
      <FramePageHead crumbs={["Strategies", "Strategy lab", "F&O"]} title="Strategy lab: F&O" meta={meta} />
      <LabTabs market="india" active="fno" />
      <p className="lede">{LEDE}</p>
      <Part label="how current the data is"><FreshnessBlock /></Part>
      <Part label="the Strategy lab: F&O"><LabBlock /></Part>
      <div className="src" role="note" aria-label="Where the figures come from">
        <span className="mb-asof" data-tip="exepex/trading's F&O publication, page strategy_lab (the trial ledger, the version registry and the scorecards)"><Icon name="schedule" />F&amp;O publication: strategy_lab</span>
        <span className="mb-tag" data-tip="After each ledger change and each NSE session's close, shown the next morning.">Not live</span>
      </div>
    </div>
  );
}
