// The Forecast lab's question cards (story W3b; design/mockups/37-forecasts at f04cb50, 4-questions.js): one per
// question, forecasters ranked within it, each verdict against the yardstick, the test's numbers folded away "for the
// curious" (marked provisional for protocol v4) and when it could settle. Every word comes from question-view.ts.
import type { FnoForecastLab } from "../../lib/fno-forecast-lab/contract.ts";
import { questionsOf, type QuestionCard } from "../../lib/fno-forecast-lab/question-view.ts";
import { HowTo, Sec } from "../fno-common/screen-bits.tsx";
import { Label } from "../ui/primitives.tsx";

const HEADS = (card: QuestionCard) => ["Rank", "Forecaster", "Days", "Missing", card.missHead];

function Card({ card }: { card: QuestionCard }) {
  return (
    <Sec className="q" aria={card.title} title={<>{card.title}<Label tone={card.state.tone} icon={card.state.icon}>{card.state.word}</Label><small>{card.meta}</small></>}>
      {card.waiting.length ? <ul className="list">{card.waiting.map((w) => <li key={w}>{w}</li>)}</ul> : null}
      {card.rows.length ? (
        <div className="md-table-wrap">
          <table className="md-table tstack">
            <thead><tr>{HEADS(card).map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {card.rows.map((r) => (
                <tr key={r.name}>
                  <td className="md-numeric" data-k="Rank">{r.rank}</td>
                  <td data-k="Forecaster">{r.name}</td>
                  <td className="md-numeric" data-k="Days">{r.days}</td>
                  <td className="md-numeric" data-k="Missing">{r.missing}</td>
                  <td className="md-numeric" data-k="Average miss">{r.miss}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {card.verdicts.length ? <ul className="marks">{card.verdicts.map((v) => <li key={v.text} className="small"><Label tone={v.look.tone} icon={v.look.icon}>{v.look.word}</Label> {v.text}</li>)}</ul> : null}
      {card.numbers.length ? (
        <details className="small curious">
          <summary>For the curious: the test’s numbers</summary>
          <ul className="list">{card.numbers.map((n) => <li key={n}>{n}</li>)}</ul>
          {card.provisional ? <p className="muted">Protocol v4 is not frozen yet: these numbers may change meaning when it is.</p> : null}
        </details>
      ) : null}
      {card.settle ? <p className="small muted settle">{card.settle}</p> : null}
      <HowTo>{`The yardstick is ${card.yardstick}, fixed before any result was seen. “Better” needs the test to say so over many days, not one lucky month.`}</HowTo>
    </Sec>
  );
}

export const LabQuestions = ({ lab }: { lab: FnoForecastLab }) => <>{questionsOf(lab).map((card) => <Card key={card.title} card={card} />)}</>;
