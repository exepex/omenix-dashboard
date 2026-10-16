// One F&O scoreboard's table (story W3h; design/mockups/42-scoreboards 2-boards.js): one row per book, never a total
// row. Every word comes from lib/fno-scoreboards/view.ts.
import { NO_VERDICT, type BookRow } from "../../lib/fno-scoreboards/view.ts";
import { ApBadge } from "../frame/parts.tsx";
import { Label } from "../ui/primitives.tsx";

const HEADS = ["Book", "Trades", "After all costs", "Worst month", "Largest fall", "Beats doing nothing?"];

export function BoardTable({ rows }: { rows: BookRow[] }) {
  return (
    <div className="md-table-wrap">
      <table className="md-table tstack">
        <thead><tr>{HEADS.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.family}>
              <td data-k="Book"><ApBadge family={r.family} /></td>
              <td className="md-numeric" data-k="Trades">{r.trades}</td>
              <td data-k="After all costs"><Label tone={r.net.tone} icon={r.net.icon}>{r.net.word}</Label></td>
              <td className="md-numeric" data-k="Worst month">{r.worstMonth}</td>
              <td className="md-numeric" data-k="Largest fall">{r.largestFall}</td>
              <td data-k="Beats doing nothing?">{r.beats ? <Label tone={r.beats.tone} icon={r.beats.icon}>{r.beats.word}</Label> : <small className="muted">{NO_VERDICT}</small>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
