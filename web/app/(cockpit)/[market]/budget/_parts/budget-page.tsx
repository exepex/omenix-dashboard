// The AI usage and budget's layout (story W3g; 43-budget 9-mount.js): the head, how current the F&O data is, then the
// month's minutes read once through the BudgetData interface (lib/fno-budget/wiring.ts chooses the adapter). Minutes
// only; the examples say Example through the frame's rule.
import { blockSection } from "../../../../../components/blocks/block-section.tsx";
import { ExampleTag } from "../../../../../components/frame/parts.tsx";
import { Part } from "../../../../../components/blocks/part.tsx";
import { FramePageHead } from "../../../../../components/ui/frame-page-head.tsx";
import { Icon } from "../../../../../components/ui/icon.tsx";
import { BudgetCap } from "../../../../../components/fno-budget/budget-cap.tsx";
import { BudgetGroups } from "../../../../../components/fno-budget/budget-groups.tsx";
import { budgetData, budgetLive } from "../../../../../lib/fno-budget/wiring.ts";
import { FreshnessBlock } from "../../_fno/freshness-block.tsx";
import "../../../../../components/fno-common/fno-screen.css";
import "./budget.css";

const LEDE = "How much AI time the desk used this month against its cap. Every AI role must earn its cost on the record.";

const BudgetBlock = () =>
  blockSection("AI usage and budget", () => budgetData.budget(), (b) => (
    <div className="stack"><BudgetCap b={b} /><BudgetGroups b={b} /></div>
  ));

export function BudgetPage() {
  const meta = (
    <>
      <span className="md-chip small"><Icon name="public" />India · F&amp;O</span>
      <ExampleTag item={{ live: budgetLive }} />
    </>
  );
  return (
    <div className="fno-screen ai-budget">
      <FramePageHead crumbs={["Control", "AI usage and budget"]} title="AI usage and budget" meta={meta} />
      <p className="lede">{LEDE}</p>
      <Part label="how current the data is"><FreshnessBlock /></Part>
      <Part label="AI usage and budget"><BudgetBlock /></Part>
      <div className="src" role="note" aria-label="Where the figures come from">
        <span className="mb-asof" data-tip="exepex/trading's F&O publication, page budget (BG1's cap reading over F8's usage ledger)"><Icon name="schedule" />F&amp;O publication: budget</span>
        <span className="mb-tag" data-tip="After each routine run, at the 07:10 IST publish.">Not live</span>
      </div>
    </div>
  );
}
