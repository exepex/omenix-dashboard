// The Forecast lab's overview (story W3b; design/mockups/37-forecasts at f04cb50): the standing line first, today's
// answers, who beats the yardstick per question, and who forecasts. Every word comes from lib/fno-forecast-lab/view.ts.
import type { FnoForecastLab } from "../../lib/fno-forecast-lab/contract.ts";
import { bestOf, forecastersOf, protocolsOf, todayOf } from "../../lib/fno-forecast-lab/view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { ApBadge } from "../frame/parts.tsx";
import { Icon } from "../ui/icon.tsx";
import { Label } from "../ui/primitives.tsx";

export const Standing = ({ lab }: { lab: FnoForecastLab }) => <p className="small standing"><Icon name="info" /> {lab.standing}</p>;

export function LabToday({ lab }: { lab: FnoForecastLab }) {
  const rows = todayOf(lab);
  return (
    <Sec title="Today: what each forecaster says" aria="Today: what each forecaster says">
      {rows.length ? (
        <div className="md-table-wrap">
          <table className="md-table tstack">
            <thead><tr><th scope="col">Question</th><th scope="col">Answers</th><th scope="col">Answer known on</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.question}><td data-k="Question">{r.question}</td><td data-k="Answers">{r.answers}</td><td data-k="Answer known on">{r.knownOn}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <Quiet>No forecast was made today.</Quiet>}
      <HowTo>Nobody is right or wrong yet: these answers are known only on the answer date. Everything below is the past, forecasts whose answers are known.</HowTo>
    </Sec>
  );
}

export function LabBest({ lab }: { lab: FnoForecastLab }) {
  const rows = bestOf(lab);
  return (
    <Sec title="The past: who beats the yardstick, question by question" aria="The past: who beats the yardstick">
      <div className="md-table-wrap">
        <table className="md-table tstack">
          <thead><tr><th scope="col">Question</th><th scope="col">Against the yardstick</th><th scope="col">Yardstick</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.question}>
                <td data-k="Question">{r.question}</td>
                <td data-k="Against the yardstick"><Label tone={r.best.tone} icon={r.best.icon}>{r.best.word}</Label>{r.worse ? <small>{r.worse}</small> : null}</td>
                <td data-k="Yardstick">{r.yardstick}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <HowTo>Each question has its own yardstick, fixed before any result. A forecaster is “better” only when the test says so over many days, not after one good week.</HowTo>
    </Sec>
  );
}

export function LabForecasters({ lab }: { lab: FnoForecastLab }) {
  return (
    <Sec title="Who forecasts" aria="Who forecasts">
      <div className="chips">{protocolsOf(lab).map((p) => <span key={p.label} className="md-chip small" data-tip={p.tip}>{p.label}</span>)}</div>
      <div className="md-table-wrap">
        <table className="md-table tstack">
          <thead><tr>{["Forecaster", "What it is", "State", "Kept from the answers by", "Days counted"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {forecastersOf(lab).map((f) => (
              <tr key={f.id}>
                <td data-k="Forecaster">{f.family ? <ApBadge family={f.family} /> : f.name}</td>
                <td data-k="What it is">{f.what}</td>
                <td data-k="State"><Label tone={f.state.tone} icon={f.state.icon}>{f.state.word}</Label></td>
                <td data-k="Kept from the answers by">{f.keptBy}</td>
                <td data-k="Days counted">{f.counted}{f.detail ? <small>{f.detail}</small> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <HowTo>A late or missing forecast is not counted and is shown here, never filled in. “Sealed same day” means an AI book commits to its answer before the deadline; it is not full isolation.</HowTo>
    </Sec>
  );
}
