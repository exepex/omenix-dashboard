// The paper trades (story W3c; design/mockups/41-paper-books 3-trades.js): open positions with their legs and today's
// monitor alerts (owner only: the dashboard is behind sign-in, the public gateway never reaches this screen), and closed
// trades after costs with the owner's three reaction-time fills. Every word comes from
// lib/fno-paper-books/trades-view.ts.
import type { FnoPaperTrades } from "../../lib/fno-paper-books/contract.ts";
import { BEFORE_FILLS, closedOf, NO_CLOSED, NO_OPEN, openOf } from "../../lib/fno-paper-books/trades-view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { ApBadge } from "../frame/parts.tsx";
import { Icon } from "../ui/icon.tsx";
import { Label, PaperTag } from "../ui/primitives.tsx";

const OPEN_HEADS = ["Book", "Strategy", "Legs", "Opened", "Most it can lose", "So far", "Days left"];
const CLOSED_HEADS = ["Book", "Strategy", "Held", "Result", "Before costs", "Costs", "After costs", "If you acted after 5 / 30 / 60 min"];
const Heads = ({ heads }: { heads: string[] }) => <thead><tr>{heads.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>;

export function PaperOpen({ p }: { p: FnoPaperTrades }) {
  const rows = openOf(p);
  const title = <>Open positions<PaperTag label="Paper" /><span className="owner small muted"><Icon name="lock" />Legs: owner only</span></>;
  return (
    <Sec title={title} aria="Open positions">
      {rows.length ? (
        <div className="md-table-wrap">
          <table className="md-table tstack">
            <Heads heads={OPEN_HEADS} />
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td data-k="Book"><ApBadge family={t.family} /></td>
                  <td data-k="Strategy">{t.strategy}<small>{t.structure}</small></td>
                  <td data-k="Legs"><span className="legs">{t.legs.map((l) => <code key={l}>{l}</code>)}</span></td>
                  <td data-k="Opened">{t.opened}</td>
                  <td className="md-numeric" data-k="Most it can lose">{t.maxLoss}</td>
                  <td data-k="So far"><Label tone={t.soFar.tone} icon={t.soFar.icon}>{t.soFar.word}</Label></td>
                  <td className="md-numeric" data-k="Days left">{t.daysLeft}{t.alerts.map((a) => <small key={a}><Icon name="lock" /> {a}</small>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Quiet>{NO_OPEN}</Quiet>}
      <HowTo>“Most it can lose” is fixed when the trade opens. “So far” is at the latest quotes, before exit costs.</HowTo>
    </Sec>
  );
}

export function PaperClosed({ p }: { p: FnoPaperTrades }) {
  const rows = closedOf(p);
  return (
    <Sec title={<>Closed trades<PaperTag label="Paper" /></>} aria="Closed trades">
      {rows.length ? (
        <div className="md-table-wrap">
          <table className="md-table tstack">
            <Heads heads={CLOSED_HEADS} />
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td data-k="Book"><ApBadge family={t.family} /></td>
                  <td data-k="Strategy">{t.strategy}<small>{t.exit}</small></td>
                  <td data-k="Held">{t.held}</td>
                  <td data-k="Result"><Label tone={t.result.tone} icon={t.result.icon}>{t.result.word}</Label></td>
                  <td className="md-numeric" data-k="Before costs">{t.gross}</td>
                  <td className="md-numeric" data-k="Costs">{t.costs}</td>
                  <td className="md-numeric" data-k="After costs">{t.net}</td>
                  <td data-k="If you acted after 5 / 30 / 60 min">
                    {t.fills ? <span className="fills">{t.fills.map((f) => <Label key={f.tip} tone={f.tone} icon={f.icon} tip={f.tip}>{f.word}</Label>)}</span> : <small className="muted">{BEFORE_FILLS}</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Quiet>{NO_CLOSED}</Quiet>}
      <HowTo>After costs is the desk’s fill. The three fills show the same decision if you had acted 5, 30 or 60 minutes after the card; the verdict uses 60. They are one decision, never three trials.</HowTo>
    </Sec>
  );
}
