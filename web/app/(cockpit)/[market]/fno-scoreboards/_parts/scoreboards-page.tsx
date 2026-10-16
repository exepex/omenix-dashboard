// The F&O scoreboards' layout (story W3h; 42-scoreboards 9-mount.js): the head, how current the F&O data is, then the
// two boards read once through the ScoreboardsData interface (lib/fno-scoreboards/wiring.ts chooses the adapter). Paper
// only; the examples say Example through the frame's rule.
import { blockSection } from "../../../../../components/blocks/block-section.tsx";
import { ExampleTag } from "../../../../../components/frame/parts.tsx";
import { Part } from "../../../../../components/blocks/part.tsx";
import { FramePageHead } from "../../../../../components/ui/frame-page-head.tsx";
import { Icon } from "../../../../../components/ui/icon.tsx";
import { PaperTag } from "../../../../../components/ui/primitives.tsx";
import { ScoreboardCards } from "../../../../../components/fno-scoreboards/board-card.tsx";
import { scoreboardsData, scoreboardsLive } from "../../../../../lib/fno-scoreboards/wiring.ts";
import { FreshnessBlock } from "../../_fno/freshness-block.tsx";
import "../../../../../components/fno-common/fno-screen.css";
import "./scoreboards.css";

const LEDE = "Two scoreboards answer two different questions, so they are shown apart and never combined into one figure. Both are paper only.";

const BoardsBlock = () => blockSection("The F&O scoreboards", () => scoreboardsData.boards(), (p) => <ScoreboardCards p={p} />);

export function ScoreboardsPage() {
  const meta = (
    <>
      <span className="md-chip small"><Icon name="public" />India · F&amp;O</span>
      <PaperTag label="Paper" />
      <ExampleTag item={{ live: scoreboardsLive }} />
    </>
  );
  return (
    <div className="fno-screen fno-boards">
      <FramePageHead crumbs={["Strategies", "F&O scoreboards"]} title="F&O scoreboards" meta={meta} />
      <p className="lede">{LEDE}</p>
      <Part label="how current the data is"><FreshnessBlock /></Part>
      <Part label="the F&O scoreboards"><BoardsBlock /></Part>
      <div className="src" role="note" aria-label="Where the figures come from">
        <span className="mb-asof" data-tip="exepex/trading's F&O publication, page scoreboards (S2's and S3's board files)"><Icon name="schedule" />F&amp;O publication: scoreboards</span>
        <span className="mb-tag" data-tip="After each scoreboard run, at the 07:10 IST publish.">Not live</span>
      </div>
    </div>
  );
}
