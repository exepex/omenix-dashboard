// What today's card has on record (story W3f; design/mockups/39-trade-card 4-why.js and 5-record.js): paper trades so
// far per book, the overnight stress line (owner only), the price of staying out, the gaps and earlier misses, what
// happens if you cannot act, the records behind the card and every forecast on record. Every word comes from
// lib/fno-card/record-view.ts and why-view.ts.
import type { FnoCard } from "../../lib/fno-card/contract.ts";
import { missesOf, onRecordOf, stressOf, tradesSoFarOf } from "../../lib/fno-card/record-view.ts";
import { hashesOf, stayOutOf } from "../../lib/fno-card/why-view.ts";
import { HowTo, Sec } from "../fno-common/screen-bits.tsx";
import { PaperTag } from "../ui/primitives.tsx";
import { Fact, LookLabel, OwnerOnly } from "./card-bits.tsx";

export function CardTradesSoFar({ c }: { c: FnoCard }) {
  const t = tradesSoFarOf(c);
  return (
    <Sec title="Paper trades so far" aria="Paper trades so far">
      <div className="facts3">{t.books.map((b) => <Fact key={b.k} k={b.k} v={b.v} note="paper trades" />)}</div>
      <p className="small muted block">{t.total}</p>
    </Sec>
  );
}

export function CardStress({ c }: { c: FnoCard }) {
  const s = stressOf(c);
  return (
    <Sec title={<>If the market jumps overnight<PaperTag label="Paper" /><OwnerOnly /></>} aria="If the market jumps overnight">
      <p className="small muted flat">{s.head}</p>
      {s.lines.map((l) => (
        <div key={l.words} className="cap">
          <b className="small">{l.words}</b>
          <div className="bar" role="img" aria-label={l.aria}><i style={{ width: `${l.bar}%` }} /></div>
        </div>
      ))}
      <HowTo>Information only. Every position has a fixed maximum loss, so no line can go past the total; the bars show how close the book is to it.</HowTo>
    </Sec>
  );
}

export function CardStayOut({ c }: { c: FnoCard }) {
  const text = stayOutOf(c);
  return text ? <Sec title="The price of staying out" aria="The price of staying out"><p className="small flat">{text}</p></Sec> : null;
}

export function CardMisses({ c }: { c: FnoCard }) {
  const m = missesOf(c);
  if (!m) return null;
  return (
    <Sec title={<>What the card is missing<LookLabel look={{ tone: "warn", icon: "warning", word: m.count }} /></>} aria="What the card is missing">
      {m.missing.length ? <ul className="list">{m.missing.map((x) => <li key={x}>{x}</li>)}</ul> : null}
      {m.earlier ? <p className="small block"><b>Earlier cards: </b>{m.earlier}</p> : null}
    </Sec>
  );
}

export function CardFooter({ c }: { c: FnoCard }) {
  return (
    <>
      <Sec title="If you cannot act in time" aria="If you cannot act in time"><p className="small flat">{c.if_you_cannot_act}</p></Sec>
      <Sec title="Records behind this card" aria="Records behind this card">
        <div className="hashes">{hashesOf(c).map((h) => <code key={h.tip} data-tip={h.tip}>{h.short}</code>)}</div>
        <HowTo>Each number on the card is copied from these records; their fingerprints (SHA-256) are in the Slack post, so the card can be checked later.</HowTo>
      </Sec>
    </>
  );
}

const RECORD_HEADS = ["Question", "Chance", "Live record", "Back-fill record"];

export function CardOnRecord({ c }: { c: FnoCard }) {
  const r = onRecordOf(c);
  if (!r) return null;
  return (
    <Sec title="Every forecast on record" aria="Every forecast on record">
      <p className="small muted flat">{r.source}</p>
      {r.late ? <p className="small flat"><LookLabel look={{ tone: "warn", icon: "timer", word: "Late" }} />{r.late}</p> : null}
      <div className="md-table-wrap">
        <table className="md-table">
          <thead><tr>{RECORD_HEADS.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {r.rows.map((q) => (
              <tr key={q.question}><td>{q.plain}</td><td className="md-numeric">{q.chance}</td><td>{q.live}</td><td>{q.backfill}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <HowTo>The house forecast is the past average until a forecaster passes its test. The back-fill was made after the fact from end-of-day data, so only the live record is evidence.</HowTo>
    </Sec>
  );
}
