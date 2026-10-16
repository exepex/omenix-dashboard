// The Strategy lab's F&O tab, its results (story W3d; design/mockups/45-strategy-lab-fno 3-results.js): what each book
// may trade and why not, the approved strategies' paper results after every cost (each its own line, never added
// across books), and the real-money checks: never eligible from this screen.
import type { FnoStrategyLab } from "../../lib/fno-strategy-lab/contract.ts";
import { booksOf, realMoneyOf, resultsOf } from "../../lib/fno-strategy-lab/view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { ApBadge } from "../frame/parts.tsx";
import { Label, PaperTag } from "../ui/primitives.tsx";

export function LabFnoBooks({ lab }: { lab: FnoStrategyLab }) {
  return (
    <Sec title={<>What each book may trade<PaperTag label="Paper" /></>} aria="What each book may trade">
      <div className="md-table-wrap">
        <table className="md-table tstack">
          <thead><tr>{["Book", "Approved strategies", "Trading?", "AI and data costs"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {booksOf(lab).map((b) => (
              <tr key={b.family}>
                <td data-k="Book"><ApBadge family={b.family} /></td>
                <td data-k="Approved strategies">{b.approved}</td>
                <td data-k="Trading?"><Label tone={b.trading.tone} icon={b.trading.icon}>{b.trading.word}</Label>{b.whyNot ? <small>{b.whyNot}</small> : null}</td>
                <td className="md-numeric" data-k="AI and data costs">{b.costs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <HowTo>A book trades only strategies that passed their test. Its AI and data costs count against its results.</HowTo>
    </Sec>
  );
}

const HEADS = ["Strategy", "Status", "Trades", "Before costs", "Costs", "After costs", "After tax", "Against an index fund"];

export function LabFnoResults({ lab }: { lab: FnoStrategyLab }) {
  const rows = resultsOf(lab);
  return (
    <Sec title={<>Paper results after every cost<PaperTag label="Paper" /></>} aria="Paper results after every cost">
      {rows.length ? (
        <div className="md-table-wrap">
          <table className="md-table tstack">
            <thead><tr>{HEADS.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.strategy}>
                  <td data-k="Strategy">{r.strategy}<small><ApBadge family={r.family} /> {r.rung}</small></td>
                  <td data-k="Status"><Label tone={r.status.tone} icon={r.status.icon}>{r.status.word}</Label>{r.pauseReason ? <small>{r.pauseReason}</small> : null}</td>
                  <td className="md-numeric" data-k="Trades">{r.trades}<small>{r.wonLost}</small></td>
                  <td className="md-numeric" data-k="Before costs">{r.gross}</td>
                  <td className="md-numeric" data-k="Costs">{r.costs}</td>
                  <td data-k="After costs"><Label tone={r.net.tone} icon={r.net.icon}>{r.net.word}</Label></td>
                  <td className="md-numeric" data-k="After tax">{r.afterTax}</td>
                  <td className="md-numeric" data-k="Against an index fund">{r.vsIndex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Quiet>No strategy has passed, so there is no paper result yet.</Quiet>}
      <HowTo>Costs are charges and price pads. “Against an index fund” is what it made above simply holding NIFTY with the same money.</HowTo>
    </Sec>
  );
}

export function LabFnoRealMoney({ lab }: { lab: FnoStrategyLab }) {
  return (
    <Sec title="Real money" aria="Real money">
      <p className="small"><Label tone="neutral" icon="lock">Not eligible</Label> Paper only: real money needs every check below and your written approval.</p>
      <ul className="marks">{realMoneyOf(lab).map((k) => <li key={k.plain} className="small"><Label tone={k.look.tone} icon={k.look.icon}>{k.look.word}</Label> {k.plain}</li>)}</ul>
    </Sec>
  );
}
