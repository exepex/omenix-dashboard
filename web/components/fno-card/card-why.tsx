// Today's card's "why and how sure" (story W3f; design/mockups/39-trade-card 4-why.js): the weather, the forecast with
// its record, the devil's advocate, the data checks and how far the strategy has come. Every word comes from
// lib/fno-card/why-view.ts.
import type { FnoCard } from "../../lib/fno-card/contract.ts";
import { advocateOf, checksOf, evidenceOf, forecastOf, NO_FORECAST, weatherOf } from "../../lib/fno-card/why-view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { LookLabel } from "./card-bits.tsx";

export function CardWeather({ c }: { c: FnoCard }) {
  const w = weatherOf(c);
  return (
    <Sec title={<>Weather<LookLabel look={w.look} /></>} aria="Weather">
      <p className="small flat">{w.why}</p>
      <HowTo>RED means a big move is much more likely than usual: no new trade that day. The weather screen has the details.</HowTo>
    </Sec>
  );
}

export function CardForecast({ c }: { c: FnoCard }) {
  const f = forecastOf(c);
  return (
    <Sec title="The forecast" aria="The forecast">
      {f ? (
        <>
          <p className="small flat">{f.plain}</p>
          <div className="chance" role="img" aria-label={f.aria}><span className="track"><i style={{ width: `${f.bar}%` }} /></span><b>{f.chance}</b></div>
          <p className="small muted flat">{f.record}</p>
          <HowTo>A chance, not a promise. The record says whether its chances have been honest so far; only the live record counts as evidence.</HowTo>
        </>
      ) : <Quiet>{NO_FORECAST}</Quiet>}
    </Sec>
  );
}

export function CardAdvocate({ c }: { c: FnoCard }) {
  const a = advocateOf(c);
  return (
    <Sec title={<>Devil’s advocate<LookLabel look={a.head} /></>} aria="Devil’s advocate">
      {a.objections.length ? <ol className="list">{a.objections.map((o) => <li key={o}>{o}</li>)}</ol> : <Quiet>{a.empty}</Quiet>}
      {a.verdict ? <p className="small block"><LookLabel look={a.verdict} /></p> : null}
    </Sec>
  );
}

export function CardChecks({ c }: { c: FnoCard }) {
  const k = checksOf(c);
  return (
    <Sec title={<>Data checks<LookLabel look={k.head} /></>} aria="Data checks">
      {k.inputs.length ? (
        <ul className="missing">{k.inputs.map((m) => <li key={m.input}><LookLabel look={{ tone: "danger", icon: "warning", word: m.story }} /><span>{m.input}<small>{m.detail}</small></span></li>)}</ul>
      ) : <Quiet>{k.empty}</Quiet>}
    </Sec>
  );
}

export function CardEvidence({ c }: { c: FnoCard }) {
  const e = evidenceOf(c);
  return (
    <Sec title="How far the strategy has come" aria="How far the strategy has come">
      <div className="ladder" role="list">
        {e.rungs.map((r) => <span key={r.n} role="listitem" className={r.on ? "on" : undefined} aria-current={r.on ? "step" : undefined}><b>Rung {r.n}</b>{r.word}</span>)}
      </div>
      <p className="small flat">{e.label ? <b>{e.label}: </b> : null}{e.text}</p>
      <p className="small block"><LookLabel look={e.realMoney} /></p>
    </Sec>
  );
}
