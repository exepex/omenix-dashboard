// The F&O data health's sources (story W3e; design/mockups/44-data-health 2-health.js): each data source's status,
// last day, rows and days missing, in the payload's order. Dates, counts and statuses only, never a data value. Every
// word comes from lib/fno-data-health/view.ts.
import type { FnoDataHealth } from "../../lib/fno-data-health/contract.ts";
import { NO_SOURCES, sourcesOf } from "../../lib/fno-data-health/view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { Label } from "../ui/primitives.tsx";

const HEADS = ["Source", "Status", "Last day", "Rows", "Days missing"];

export function HealthSources({ h }: { h: FnoDataHealth }) {
  const rows = sourcesOf(h);
  return (
    <Sec title="Data sources" aria="Data sources">
      {rows.length ? (
        <div className="md-table-wrap">
          <table className="md-table tstack">
            <thead><tr>{HEADS.map((x) => <th key={x} scope="col">{x}</th>)}</tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td data-k="Source">{s.plain}<small>{s.id}</small></td>
                  <td data-k="Status"><Label tone={s.look.tone} icon={s.look.icon}>{s.look.word}</Label></td>
                  <td data-k="Last day">{s.lastDay}</td>
                  <td className="md-numeric" data-k="Rows">{s.rows}</td>
                  <td className="md-numeric" data-k="Days missing">{s.gaps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Quiet>{NO_SOURCES}</Quiet>}
      <HowTo>Days missing are sessions the NSE calendar says should be there. A source behind means its newest day is older than it should be.</HowTo>
    </Sec>
  );
}
