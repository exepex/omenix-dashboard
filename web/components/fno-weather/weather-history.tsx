// The weather history's two parts (story W3a part 2; design/mockups/46-weather-history 2-counts.js and 3-sessions.js):
// how often each colour (numbers, shares, one bar whose parts are also named, live against rebuilt), then every
// session by month. Every word comes from lib/fno-weather/history-view.ts.
import type { FnoWeatherHistory } from "../../lib/fno-weather/contract.ts";
import { countsOf, monthsOf } from "../../lib/fno-weather/history-view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { ColourLabel } from "./weather-bits.tsx";

export function HistoryCounts({ h }: { h: FnoWeatherHistory }) {
  const c = countsOf(h);
  return (
    <Sec title="How often each colour" aria="How often each colour">
      {c.kind === "none" ? <Quiet>{c.text}</Quiet> : (
        <div>
          <div className="facts4">
            {c.facts.map((f) => <div key={f.label} className="mb-fact"><span className="k">{f.label}</span><b>{f.value}</b><small>{f.note}</small></div>)}
          </div>
          <div className="mix" role="img" aria-label={c.aria}>{c.mix.map((m) => <i key={m.tone} className={m.tone} style={{ width: `${m.width}%` }} />)}</div>
          <p className="small counted"><b>{c.live}</b> · {c.rebuilt}</p>
        </div>
      )}
      <HowTo>A “rebuilt” session was coloured later from past data, to give the weather a history; it was never a live call, so it counts as exploratory, not as proof.</HowTo>
    </Sec>
  );
}

export function HistorySessions({ h }: { h: FnoWeatherHistory }) {
  const months = monthsOf(h);
  if (!months.length) return null;
  return (
    <Sec title="Session by session" aria="Session by session">
      {months.map((m) => (
        <div key={m.month}>
          <h3>{m.month}</h3>
          <div className="strip" role="list" aria-label={m.month}>
            {m.tiles.map((t) => <span key={t.day} role="listitem">{t.day}<ColourLabel look={t.label} /><small>{t.mark}</small></span>)}
          </div>
        </div>
      ))}
      <HowTo>Read it left to right, oldest first. A run of RED means the weather kept new trades off for those sessions; whether that was right shows on the weather page’s record.</HowTo>
    </Sec>
  );
}
