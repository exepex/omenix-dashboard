// The weather screen's record (story W3a; design/mockups/40-weather 3-record.js): the last sessions' colours against
// what happened, how often it is RED against its frozen maximum, its score against the usual chance and the old v0
// checklist, and this month's price of the RED rule (Paper). Every word comes from lib/fno-weather/record-view.ts.
import type { FnoWeather } from "../../lib/fno-weather/contract.ts";
import { priceOf, recentOf, redShareOf, scoresOf } from "../../lib/fno-weather/record-view.ts";
import { Label, PaperTag } from "../ui/primitives.tsx";
import { ColourLabel, HowTo, Quiet, Sec } from "./weather-bits.tsx";

export function WeatherRecent({ w }: { w: FnoWeather }) {
  return (
    <Sec title="The last sessions" aria="The last sessions">
      <div className="strip" role="list">
        {recentOf(w).map((r) => <span key={r.day} role="listitem">{r.day}<ColourLabel look={r.label} />{r.outcome}{r.rebuilt ? <small>rebuilt</small> : null}</span>)}
      </div>
      <HowTo>Each session’s colour and whether a 2% move came next; “rebuilt” marks a day worked out later from history, not on the day. A RED with no move is not a mistake on its own; only many sessions tell.</HowTo>
    </Sec>
  );
}

export function WeatherRedShare({ w }: { w: FnoWeather }) {
  const r = redShareOf(w);
  return (
    <Sec title={<>How often it is RED<Label tone={r.tone} icon={r.icon}>{r.state}</Label></>} aria="How often it is RED">
      <div className="cap">
        <div className="bar" role="img" aria-label={r.aria}><i style={{ width: `${r.bar}%` }} /></div>
        <small className="muted">{r.words}</small>
      </div>
    </Sec>
  );
}

const HEADS = ["Question", "Against", "Days", "Miss score", "Its miss score", "Verdict"];

export function WeatherScores({ w }: { w: FnoWeather }) {
  return (
    <Sec title="Its record against the usual chance" aria="Its record against the usual chance">
      <div className="md-table-wrap">
        <table className="md-table tstack">
          <thead><tr>{HEADS.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {scoresOf(w).map((s) => (
              <tr key={`${s.question}-${s.against}`}>
                <td data-k="Question">{s.question}</td>
                <td data-k="Against">{s.against}</td>
                <td className="md-numeric" data-k="Days">{s.days}<small>{s.needs}</small></td>
                <td className="md-numeric" data-k="Miss score">{s.brier}</td>
                <td className="md-numeric" data-k="Its miss score">{s.brierBaseline}</td>
                <td data-k="Verdict"><Label tone={s.verdict.tone} icon={s.verdict.icon}>{s.verdict.word}</Label>{s.exploratory ? <small>{s.exploratory}</small> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <HowTo>Miss score (Brier): 0 is perfect; lower is better. The weather must beat both the usual chance and the old checklist (v0) to replace it.</HowTo>
    </Sec>
  );
}

export function WeatherPrice({ w }: { w: FnoWeather }) {
  const p = priceOf(w);
  return (
    <Sec title={<>This month’s price of the RED rule<PaperTag label="Paper" /></>} aria="This month’s price of the RED rule">
      {p.kind === "measured" ? (
        <div className="facts3">
          {p.facts.map((f) => <div key={f.label} className="mb-fact"><span className="k">{f.label}</span><b>{f.value}</b>{f.note ? <small>{f.note}</small> : null}</div>)}
        </div>
      ) : <Quiet>{p.text}</Quiet>}
      <HowTo>RED is kept by choice as a survival rule. This shows honestly whether it costs or saves money.</HowTo>
    </Sec>
  );
}
