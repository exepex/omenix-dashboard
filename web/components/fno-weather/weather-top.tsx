// The weather screen's top (story W3a; design/mockups/40-weather 2-top.js): today's colour with its meaning and what
// it means for new paper trades (or why there is none), the two chances against the usual chance, what moved it and
// the session's upgrades. Every word comes from the view (lib/fno-weather/view.ts); none names a colour's level.
import type { FnoWeather } from "../../lib/fno-weather/contract.ts";
import { chancesOf, colourLabel, driversOf, NO_DRIVERS, NO_UPGRADES, upgradesOf, verdictOf } from "../../lib/fno-weather/view.ts";
import { Icon } from "../ui/icon.tsx";
import { Label } from "../ui/primitives.tsx";
import { ColourLabel, HowTo, Quiet, Sec } from "./weather-bits.tsx";

export function WeatherVerdict({ w }: { w: FnoWeather }) {
  const v = verdictOf(w);
  if (v.kind === "missing") {
    return (
      <section className="mb-verdict no" aria-label="No weather today">
        <span className="mb-verdict-box" aria-hidden="true"><Icon name="warning" /></span>
        <div>
          <div className="mb-verdict-word">No weather<small>{v.detail}</small></div>
          <p className="why">{v.entries}</p>
          <ul className="list">{v.missing.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      </section>
    );
  }
  return (
    <section className={`mb-verdict ${v.look.verdict}`} aria-label="Today’s weather">
      <span className="mb-verdict-box" aria-hidden="true"><Icon name={v.look.icon} /></span>
      <div>
        <div className="mb-verdict-word">{v.colour}<small>{v.detail}</small></div>
        <p className="why">{v.entries}</p>
      </div>
    </section>
  );
}

export function WeatherChances({ w }: { w: FnoWeather }) {
  return (
    <Sec title="The chance of a big move" aria="The chance of a big move">
      {chancesOf(w).map((c) => (
        <div key={c.label}>
          <p className="small" style={{ margin: "8px 0 0" }}>{c.label}</p>
          <div className="chance" role="img" aria-label={c.aria}>
            <span className="track">
              {c.bar === null ? null : <i style={{ width: `${c.bar}%` }} />}
              {c.usualAt === null ? null : <span className="base" style={{ left: `${c.usualAt}%` }} />}
            </span>
            <b>{c.value}</b>
          </div>
          <small className="muted">{c.usual}</small>
        </div>
      ))}
      <HowTo>The bar is the chance today; the black tick is the usual chance. The scale ends at 50%.</HowTo>
    </Sec>
  );
}

export function WeatherDrivers({ w }: { w: FnoWeather }) {
  const drivers = driversOf(w);
  return (
    <Sec title="What moved it" aria="What moved it">
      {drivers.length ? (
        <ul className="drivers">{drivers.map((d) => <li key={d.text}><Label tone={d.tone} icon={d.icon}>{d.push}</Label>{d.text}</li>)}</ul>
      ) : <Quiet>{NO_DRIVERS}</Quiet>}
    </Sec>
  );
}

export function WeatherUpgrades({ w }: { w: FnoWeather }) {
  const ups = upgradesOf(w);
  return (
    <Sec title="During the session" aria="During the session">
      {ups.length ? (
        <ul className="drivers">
          {ups.map((u) => <li key={u.at}><b>{u.at}</b><ColourLabel look={colourLabel(u.from)} /><Icon name="chevron_right" /><ColourLabel look={colourLabel(u.to)} />{u.why}</li>)}
        </ul>
      ) : <Quiet>{NO_UPGRADES}</Quiet>}
      <HowTo>The live monitor can only raise the colour during a session (AMBER to RED), never lower it.</HowTo>
    </Sec>
  );
}
