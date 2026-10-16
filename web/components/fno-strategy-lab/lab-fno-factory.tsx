// The Strategy lab's F&O tab, its top (story W3d; design/mockups/45-strategy-lab-fno 2-factory.js): the headline and
// every idea tried, newest first, with how many passes chance alone would give. Never an idea's rules.
import type { FnoStrategyLab } from "../../lib/fno-strategy-lab/contract.ts";
import { factoryOf, headlineOf } from "../../lib/fno-strategy-lab/view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { Icon } from "../ui/icon.tsx";
import { Label } from "../ui/primitives.tsx";

export function LabFnoHeadline({ lab }: { lab: FnoStrategyLab }) {
  const h = headlineOf(lab);
  return (
    <section className={`mb-verdict ${h.verdict}`} aria-label="Headline">
      <span className="mb-verdict-box" aria-hidden="true"><Icon name={h.icon} /></span>
      <div>
        <div className="mb-verdict-word">{h.word}</div>
        <p className="why">{h.text}</p>
      </div>
    </section>
  );
}

const HEADS = ["Trial", "Idea", "Rests on", "Got to", "Status", "Evidence"];

export function LabFnoFactory({ lab }: { lab: FnoStrategyLab }) {
  const f = factoryOf(lab);
  return (
    <Sec title="Every idea tried" aria="Every idea tried">
      <div className="chips">{f.chips.map((c) => <span key={c} className="md-chip small">{c}</span>)}</div>
      <p className="small">{f.words}</p>
      {f.ideas.length ? (
        <div className="md-table-wrap">
          <table className="md-table tstack">
            <thead><tr>{HEADS.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {f.ideas.map((i) => (
                <tr key={i.trial}>
                  <td className="md-numeric" data-k="Trial">{i.trial}</td>
                  <td data-k="Idea">{i.title}</td>
                  <td data-k="Rests on">{i.restsOn}</td>
                  <td data-k="Got to">{i.gate}</td>
                  <td data-k="Status"><Label tone={i.status.tone} icon={i.status.icon}>{i.status.word}</Label></td>
                  <td data-k="Evidence">{i.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Quiet>No idea listed.</Quiet>}
      <HowTo>Every idea ever tried is counted, failures included, so one lucky pass cannot hide among many tries.</HowTo>
    </Sec>
  );
}
