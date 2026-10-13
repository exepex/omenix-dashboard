"use client";
// Home sections 5-6 (story W9; 31 notes.md rows 5-6): what needs you today, what is coming (the event calendar) and
// the top news with how far each story is confirmed. In India "Coming up" also lists the F&O tool's expiry dates
// (W9-F&O); where those are real and the stock rows are examples, each example row says so.
import type { Attention, TopNews } from "../../lib/home/contract.ts";
import type { ComingRow } from "../../lib/home/events.ts";
import { MONTH } from "../../lib/ui/format.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "../frame/frame-context.tsx";
import { dateShort, when } from "../../lib/shell/clock.ts";
import { StockExampleTag, Tk } from "../frame/parts.tsx";
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

/** `sessionDate` null: the session block is not there, so "today" is the frame's session day. */
export function ComingUp({ rows, fnoMissing, sessionDate }: { rows: ComingRow[]; fnoMissing: string | null; sessionDate: string | null }) {
  const { shell, item } = useFrame();
  const today = sessionDate ?? shell.status.session_date;
  return (
    <section className="card" aria-label="Coming up">
      <SectionHead title="Coming up" sub={shell.fno ? "Results, policy and holidays from the stock tool’s event calendar; F&O expiry from the F&O tool." : "Results, policy and holidays from the stock tool’s event calendar."} go={["Calendar", "events"]} />
      <ul className="ev">
        {rows.map(({ event: e, live }) => {
          const d = new Date(`${e.date}T00:00:00Z`);
          return (
            <li key={`${e.date}:${e.title}`}>
              <span className="d"><b>{d.getUTCDate()}</b><small>{MONTH[d.getUTCMonth()]}</small></span>
              <span>
                <b>{e.inst && item(e.inst) ? <Tk id={e.inst}>{e.title}</Tk> : e.title}</b>
                <small>{`${dateShort(`${e.date}T06:00:00Z`, shell)}${e.date === today ? " · today" : ""} · ${KIND[e.kind] ?? e.kind}${e.major ? " · major" : ""}`}{live ? null : <> <StockExampleTag /></>}</small>
              </span>
            </li>
          );
        })}
        {fnoMissing ? <li className="quiet">{`F&O expiry dates: ${fnoMissing}`}</li> : null}
        {rows.length || fnoMissing ? null : <li className="quiet">Nothing scheduled.</li>}
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
