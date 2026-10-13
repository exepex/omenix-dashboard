"use client";
// Home section 4 (story W9; 31 notes.md row 4): who trades, and how it is going. One card each for You, Rule-based,
// Hybrid and AI team; each group's headline is its own total from the Groups block (the owner's one allowed sum), the
// F&O book its own line in India, the strategies collapsed under one button, "Open <group>" for the detail. Baselines
// are one comparison line. Every figure is a block field; nothing is added up here.
import type { ReactNode } from "react";
import type { Accounts, FnoBook, Groups, Positions } from "../../lib/home/contract.ts";
import { groupCards, plural, type GroupCard } from "../../lib/home/groups.ts";
import { src } from "../../lib/home/sources.ts";
import { HelpTip, Icon } from "../ui/icon.tsx";
import { useFrame } from "../frame/frame-context.tsx";
import { StockExampleTag } from "../frame/parts.tsx";
import { Money, MoneyDelta, SectionHead } from "./section-head.tsx";

const SHORT: Record<string, string> = { manual: "Your own trades", rule: "Rules only, no AI", hybrid: "AI team within the rules", ai: "Fully autonomous AI agents" };
const TONE: Record<string, string> = { manual: "paper", rule: "", hybrid: "warn", ai: "info" };

function CardHead({ family }: { family: "manual" | "rule" | "hybrid" | "ai" }) {
  const { data, shell } = useFrame();
  const f = data.families[family];
  return (
    <div className="h">
      <span className={`mb-avatar ${TONE[family]}`}><Icon name={f.icon} /></span>
      <b>{f.label}<HelpTip tip={shell.family_text[family]} /></b>
      <small>{SHORT[family]}</small>
    </div>
  );
}

function Figure({ label, sub, children }: { label: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <div className="line">
      <span className="k">{label}</span>
      <div className="fig">{children}</div>
      {sub ? <span className="s">{sub}</span> : null}
    </div>
  );
}

function Link({ label, screen }: { label: string; screen: string }) {
  const { go } = useFrame();
  return (
    <a className="mb-apcard-go" href="#" onClick={(e) => { e.preventDefault(); go(screen); }}>
      {label}
      <Icon name="chevron_right" />
    </a>
  );
}

function YouCard({ accounts, positions }: { accounts: Accounts; positions: Positions }) {
  const mine = accounts.accounts.manual;
  return (
    <article className="mb-apcard">
      <CardHead family="manual" />
      <Figure label="Open profit / loss" sub={<>account <Money value={mine.value} src={src("accounts", "accounts.manual.value")} />{` · ${plural(positions.own.length, "trade", "trades")} open`}</>}>
        <span className="val"><MoneyDelta value={mine.open_profit} src={src("accounts", "accounts.manual.open_profit")} /></span>
      </Figure>
      <Link label="See your trades" screen="portfolios" />
    </article>
  );
}

function GroupCardView({ c, booksMissing }: { c: GroupCard; booksMissing: string | null }) {
  const { data } = useFrame();
  return (
    <article className="mb-apcard">
      <CardHead family={c.family} />
      <Figure label={c.totalLabel} sub={c.totalSub}>
        {c.total ? <span className="val"><MoneyDelta value={c.total.net} src={c.totalSrc} /> <StockExampleTag /></span> : <span className="none">No strategy yet</span>}
      </Figure>
      {c.book && c.bookSrc ? (
        <Figure label="F&O: total profit / loss" sub={c.bookSub}>
          <span className="val"><MoneyDelta value={c.book.pnl} src={c.bookSrc} /></span>
        </Figure>
      ) : booksMissing ? (
        <Figure label="F&O: total profit / loss" sub={booksMissing}>
          <span className="none">No data</span>
        </Figure>
      ) : null}
      {c.hasList ? (
        <details className="mb-apcard-more">
          <summary><span>{c.countLine}</span><Icon name="expand_more" /></summary>
          <ul>
            {c.ran.map(({ result: s, src: from }) => <li key={s.id}><span>{s.name}</span><MoneyDelta value={s.net} src={from} /></li>)}
            {c.idle ? <li className="idle"><span>{`${c.idle} more: no trade yet`}</span></li> : null}
          </ul>
          <p>Each strategy’s own result; the total above adds them up.</p>
        </details>
      ) : c.total ? (
        <div className="mb-apcard-count">{c.countLine}</div>
      ) : null}
      <Link label={`Open ${data.families[c.family].label}`} screen="scoreboards" />
    </article>
  );
}

/** `books`: null in the US (no F&O line at all); in India an empty list with `booksMissing` when the block has no data. */
export function WhoTrades({ groups, books, booksMissing, accounts, positions }: { groups: Groups; books: FnoBook[] | null; booksMissing: string | null; accounts: Accounts; positions: Positions }) {
  const { go } = useFrame();
  const base = groups.baselines.total;
  return (
    <section className="sec" aria-label="Who trades">
      <SectionHead title="Who trades, and how it is going" sub="Each group’s total paper profit or loss. Open a group for each of its strategies." go={["Strategies", "scoreboards"]} />
      <div className="aps">
        <YouCard accounts={accounts} positions={positions} />
        {groupCards(groups, books).map((c) => <GroupCardView key={c.family} c={c} booksMissing={booksMissing} />)}
      </div>
      <p className="note">
        <Icon name="trending_flat" />
        {" Baselines (yardsticks to beat), their own total: "}
        <MoneyDelta value={base.net} src={src("groups", "baselines.total.net")} />
        {` from ${plural(base.with_trades, "baseline", "baselines")} with trades · `}
        <a href="#" onClick={(e) => { e.preventDefault(); go("scoreboards"); }}>Open Baselines</a>
      </p>
    </section>
  );
}
