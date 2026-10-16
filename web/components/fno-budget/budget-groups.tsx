// The month's minutes by kind of work (story W3g; design/mockups/43-budget 2-budget.js), largest first as sent. Minutes
// and runs only. Every word comes from lib/fno-budget/view.ts.
import type { FnoBudget } from "../../lib/fno-budget/contract.ts";
import { groupsOf, NO_GROUPS } from "../../lib/fno-budget/view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";

const HEADS = ["Kind of work", "Minutes", "Runs"];

export function BudgetGroups({ b }: { b: FnoBudget }) {
  const rows = groupsOf(b);
  return (
    <Sec title="Minutes by kind of work" aria="Minutes by kind of work">
      {rows.length ? (
        <div className="md-table-wrap">
          <table className="md-table">
            <thead><tr>{HEADS.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r) => <tr key={r.group}><td>{r.group}</td><td className="md-numeric">{r.minutes}</td><td className="md-numeric">{r.runs}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <Quiet>{NO_GROUPS}</Quiet>}
      <HowTo>Building the tool counts in the basis, not against the cap.</HowTo>
    </Sec>
  );
}
