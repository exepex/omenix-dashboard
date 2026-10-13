"use client";
// World markets, currencies and commodities, and what is coming (story W12; 34 notes rows 11 and 12). Each quote keeps
// its own close and date (some are stamped on a weekend); events are the next 12 of the calendar, the Markets view of
// Home's events block.
import type { Events } from "../../lib/home/contract.ts";
import type { World } from "../../lib/overview/contract.ts";
import type { MarketsState } from "../../lib/overview/state.ts";
import { EVENT_KIND } from "../../lib/overview/view.ts";
import { dateShort } from "../../lib/shell/clock.ts";
import { sourceName } from "../../lib/ui/sources.ts";
import { useFrame } from "../frame/frame-context.tsx";
import { Tk } from "../frame/parts.tsx";
import { Chg, Num } from "../ui/figures.tsx";
import { Icon } from "../ui/icon.tsx";
import { SectionHead } from "../blocks/section-head.tsx";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function WorldCard({ world, state, india, locale }: { world: World; state: MarketsState; india: boolean; locale: string }) {
  const { shell } = useFrame();
  const day = (d: string) => dateShort(`${d}T12:00:00Z`, shell);
  const at = (i: number, f: string) => sourceName("world", `quotes[${i}].${f}`);
  return (
    <section className="card" aria-label="World">
      <SectionHead title={india ? "World cues, currency and commodities" : "World, currencies and commodities"} sub="each at its own last close" />
      <div className="mb-heat">
        {world.quotes.map((w, i) => (
          <div key={w.name} className="mb-heat-tile plain" data-tip={`${w.name}: close on ${day(w.as_of)}`}>
            <span className="n">{w.name.replace(" (previous US close)", "")}</span>
            <b><Num value={w.close} src={at(i, "close")} locale={locale} /></b>
            <small><Chg value={w[state.per]} src={at(i, state.per)} />{` · ${day(w.as_of).replace(/^\w+ /, "")}`}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

/** `missing`: the reasons a publisher's part of the list has no data (contract 2.5: two publishers in India). */
export function EventsCard({ events, missing, india }: { events: Events; missing: string[]; india: boolean }) {
  const { shell, item } = useFrame();
  return (
    <section className="card" aria-label="Coming up">
      <SectionHead title="What is coming?" sub={india ? "results, dividends and NIFTY expiries" : "results, dividends, filings and the economy"} />
      <ul className="list ev">
        {events.events.slice(0, 12).map((e, i) => {
          const d = new Date(`${e.date}T00:00:00Z`);
          const [label, icon] = EVENT_KIND[e.kind] ?? [e.kind, "event"];
          return (
            <li key={`${e.date}-${i}`}>
              <span className="d"><b>{d.getUTCDate()}</b><small>{MON[d.getUTCMonth()]}</small></span>
              <span>
                <b>{e.inst && item(e.inst) ? <Tk id={e.inst}>{e.title}</Tk> : e.title}</b>
                <small><Icon name={icon} />{` ${label} · ${dateShort(`${e.date}T10:00:00Z`, shell)}`}</small>
              </span>
            </li>
          );
        })}
        {missing.map((m) => <li key={m} className="quiet">{m}</li>)}
      </ul>
    </section>
  );
}
