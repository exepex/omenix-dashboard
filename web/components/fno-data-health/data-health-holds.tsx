// The F&O pages held back (story W3e; contract 2.13.0, page `page_holds`; design/mockups/44-data-health 3-holds.js):
// which page is held, since when, why, and what its screen shows meanwhile. Unknown holds (a publication without the
// page) say so, never "none". Every word comes from lib/fno-holds/holds.ts.
import { holdRowsOf, type FnoPageHolds } from "../../lib/fno-holds/holds.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { Label } from "../ui/primitives.tsx";

const HEADS = ["Page", "Held since", "Why", "What its screen shows"];

export const HOLDS_UNKNOWN = "Not known: this publication does not say which pages are held back.";

function Head({ holds }: { holds: FnoPageHolds | null }) {
  if (!holds) return <Label tone="neutral" icon="help">Unknown</Label>;
  return holds.holds.length ? <Label tone="warn" icon="warning">{`${holds.holds.length} held`}</Label> : <Label tone="success" icon="check">None</Label>;
}

export function HealthHolds({ holds }: { holds: FnoPageHolds | null }) {
  const rows = holds ? holdRowsOf(holds) : [];
  return (
    <Sec title={<>Pages held back<Head holds={holds} /></>} aria="Pages held back">
      {!holds ? <Quiet>{HOLDS_UNKNOWN}</Quiet> : rows.length ? (
        <div className="md-table-wrap">
          <table className="md-table tstack">
            <thead><tr>{HEADS.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.page}><td data-k="Page">{r.page}</td><td data-k="Held since">{r.since}</td><td data-k="Why">{r.why}</td><td data-k="What its screen shows">{r.shows}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Quiet>Every page was published normally.</Quiet>}
      <HowTo>A page is held back when publishing it would break a rule or state something no longer true. Each held page says so on its own screen too, not only by its date.</HowTo>
    </Sec>
  );
}
