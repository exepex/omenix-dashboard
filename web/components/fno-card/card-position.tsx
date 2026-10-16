// Today's card's position (story W3f; design/mockups/39-trade-card 3-position.js), TRADE and WATCH only, owner only:
// what, the legs, the entry range, how much, the most it can lose, the worst stretches, the exits and what would prove
// it wrong, costs and tax. Every word comes from lib/fno-card/position-view.ts.
import type { FnoCard } from "../../lib/fno-card/contract.ts";
import { NO_POSITION, positionOf, type EntryRange, type Position } from "../../lib/fno-card/position-view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { ApBadge } from "../frame/parts.tsx";
import { PaperTag } from "../ui/primitives.tsx";
import { Fact, LookLabel, OwnerOnly } from "./card-bits.tsx";

const LEG_HEADS = ["Leg", "Strike", "Expiry", "Lots"];

function Legs({ p }: { p: Position }) {
  return (
    <div className="md-table-wrap">
      <table className="md-table">
        <thead><tr>{LEG_HEADS.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>
          {p.legs.map((l) => (
            <tr key={l.contract}>
              <td><LookLabel look={l.side} /> {l.type}<small>{l.contract}</small></td>
              <td className="md-numeric">{l.strike}</td>
              <td>{l.expiry}</td>
              <td className="md-numeric">{l.lots}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Entry({ e }: { e: EntryRange }) {
  return (
    <div className="entry">
      <b className="small">{e.words}</b>
      <div className="range" role="img" aria-label={e.aria}>
        <span className="track" />
        <span className="ok" style={{ left: `${e.okFrom}%`, width: `${e.okWidth}%` }} />
        <span className="stop" style={{ left: `${e.stopAt}%` }} />
      </div>
      <div className="range-keys">{e.keys.map((k) => <span key={k}>{k}</span>)}</div>
      <HowTo>{e.validity}</HowTo>
    </div>
  );
}

const Facts = ({ facts }: { facts: { k: string; v: string; note?: string }[] }) => <div className="facts3">{facts.map((f) => <Fact key={f.k} k={f.k} v={f.v} note={f.note} />)}</div>;

export function CardPosition({ c }: { c: FnoCard }) {
  const p = positionOf(c);
  if (!p || !c.trade) return <Sec title="The position" aria="The position"><Quiet>{NO_POSITION}</Quiet></Sec>;
  return (
    <>
      <Sec title={<><span>{p.title}</span><PaperTag label="Paper" /><OwnerOnly /></>} aria={p.title}>
        <p className="what">{p.what}</p>
        <p className="small muted strategy">{p.strategy} · <ApBadge family={c.trade.family} /></p>
        <Legs p={p} />
        <Entry e={p.entry} />
        <div className="block"><Facts facts={p.size} /></div>
        <div className="cap block">
          <b className="small">{p.maxLoss.words}</b>
          <div className="bar" role="img" aria-label={p.maxLoss.aria}><i style={{ width: `${p.maxLoss.bar}%` }} /></div>
          <small className="muted">{p.maxLoss.note}</small>
        </div>
      </Sec>
      <Sec title="If it goes badly" aria="If it goes badly">
        <ul className="list">{p.worstCases.map((w) => <li key={w}>{w}</li>)}</ul>
        <HowTo>Stress tests of the same position through the worst stretches on record. They show the worst case, never an edge.</HowTo>
      </Sec>
      <Sec title="How it ends" aria="How it ends">
        <ul className="list">{p.exits.map((x) => <li key={x}>{x}</li>)}</ul>
        <h2 className="sub">What would prove it wrong</h2>
        <ul className="list">{p.provesWrong.map((x) => <li key={x}>{x}</li>)}</ul>
      </Sec>
      <Sec title={<>Costs and tax<PaperTag label="Paper" /></>} aria="Costs and tax">
        <Facts facts={p.costs} />
        {p.volEdge ? <div className="block"><Facts facts={p.volEdge} /></div> : null}
      </Sec>
    </>
  );
}
