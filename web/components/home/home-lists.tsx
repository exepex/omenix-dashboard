"use client";
// Home sections 5-6 (story W9; 31 notes.md rows 5-6): what needs you today, what is coming (the event calendar) and
// the top news with how far each story is confirmed.
import type { Attention, Events, TopNews } from "../../lib/home/contract.ts";
import { MONTH } from "../../lib/ui/format.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "../frame/frame-context.tsx";
import { dateShort, when } from "../../lib/shell/clock.ts";
import { Tk } from "../frame/parts.tsx";
import { SectionHead } from "./section-head.tsx";

const KIND: Record<string, string> = { rbi_policy: "Policy", earnings: "Results", holiday: "Holiday", fno_expiry: "F&O expiry", fomc: "Fed", jobs_report: "Jobs data", cpi: "Inflation" };
const STATUS: Record<string, string> = { confirmed_primary: "confirmed", corroborated: "corroborated", single_source: "single source", unverified: "unverified", rumour: "rumour", promotional: "promotional", contradicted: "contradicted", not_checked: "not checked yet" };

export function NeedsYou({ attention }: { attention: Attention }) {
  return (
    <section className="card" id="needs" aria-label="Needs you">
      <SectionHead title="Needs you" sub="Things to look at today." />
      <ul className="att">
        {attention.attention.map((a) => (
          <li key={a.title}>
            <span className={`mb-avatar sm ${a.tone}`}><Icon name={a.icon} /></span>
            <span><b>{a.title}</b><small>{a.sub}</small></span>
          </li>
        ))}
        {attention.attention.length ? null : <li className="quiet">Nothing needs you.</li>}
      </ul>
    </section>
  );
}

export function ComingUp({ events, sessionDate }: { events: Events; sessionDate: string }) {
  const { shell, item } = useFrame();
  return (
    <section className="card" aria-label="Coming up">
      <SectionHead title="Coming up" sub="Results, policy, holidays and expiry from the stock tool’s event calendar." go={["Calendar", "events"]} />
      <ul className="ev">
        {events.events.map((e) => {
          const d = new Date(`${e.date}T00:00:00Z`);
          return (
            <li key={`${e.date}:${e.title}`}>
              <span className="d"><b>{d.getUTCDate()}</b><small>{MONTH[d.getUTCMonth()]}</small></span>
              <span>
                <b>{e.inst && item(e.inst) ? <Tk id={e.inst}>{e.title}</Tk> : e.title}</b>
                <small>{`${dateShort(`${e.date}T06:00:00Z`, shell)}${e.date === sessionDate ? " · today" : ""} · ${KIND[e.kind] ?? e.kind}${e.major ? " · major" : ""}`}</small>
              </span>
            </li>
          );
        })}
        {events.events.length ? null : <li className="quiet">Nothing scheduled.</li>}
      </ul>
    </section>
  );
}

export function TopNewsList({ news }: { news: TopNews }) {
  const { data, shell, item } = useFrame();
  return (
    <section className="card" aria-label="Top news">
      <SectionHead title="Top news" sub="From the news run, with how far each story is confirmed." go={["News", "news"]} />
      <ul className="news">
        {news.news.map((n) => (
          <li key={n.title}>
            <b>{n.title}</b>
            <span className="m">
              {n.tickers.map((t) => (item(t) ? <Tk key={t} id={t} /> : <span key={t}>{t}</span>))}
              <span className={`md-badge ${n.status}`}>{STATUS[n.status] ?? n.status}</span>
              {`${n.src} · ${when(n.at, data.now, shell)}`}
            </span>
          </li>
        ))}
        {news.news.length ? null : <li className="quiet">No news stored yet.</li>}
      </ul>
    </section>
  );
}
