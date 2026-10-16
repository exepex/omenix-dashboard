// The paper books' accounts (story W3c; design/mockups/41-paper-books 2-books.js): one card per book, its own account
// (never added to another), then the shadow tests in their own section. Every word comes from
// lib/fno-paper-books/view.ts.
import type { FnoPaperTrades } from "../../lib/fno-paper-books/contract.ts";
import { booksOf, NO_SHADOWS, shadowsOf, type BookCard } from "../../lib/fno-paper-books/view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { ApBadge } from "../frame/parts.tsx";
import { Label, PaperTag } from "../ui/primitives.tsx";

const Fact = ({ k, v, note }: { k: string; v: string; note?: string }) => (
  <div className="mb-fact"><span className="k">{k}</span><b>{v}</b>{note ? <small>{note}</small> : null}</div>
);

const Bar = ({ bar }: { bar: BookCard["brake"] }) => (
  <div className="cap">
    <div className="bar" role="img" aria-label={bar.aria}><i style={{ width: `${bar.bar}%` }} /></div>
    <small className="muted">{bar.words}</small>
  </div>
);

function Book({ b }: { b: BookCard }) {
  return (
    <Sec title={<><ApBadge family={b.family} /><PaperTag label="Paper" /></>} aria={`${b.family} book`}>
      <Fact k="Value" v={b.value} note={b.marks} />
      <p className="change"><Label tone={b.change.tone} icon={b.change.icon}>{b.change.word}</Label><small className="muted">{b.opening}</small></p>
      <div className="facts2"><Fact k="Cash" v={b.cash} /><Fact k="Open positions" v={b.open} /></div>
      <Bar bar={b.openRisk} />
      <Bar bar={b.brake} />
      <HowTo>Value is cash plus the open positions at their latest quotes. A book with no trade stays at its opening value.</HowTo>
    </Sec>
  );
}

export function PaperBookCards({ p }: { p: FnoPaperTrades }) {
  return <div className="cards3">{booksOf(p).map((b) => <Book key={b.family} b={b} />)}</div>;
}

export function PaperShadows({ p }: { p: FnoPaperTrades }) {
  const shadows = shadowsOf(p);
  return (
    <Sec title={<>Shadow tests<PaperTag label="Paper" /></>} aria="Shadow tests">
      {shadows.length ? (
        <div className="cards3">{shadows.map((s) => <Fact key={s.name} k={s.kind} v={s.name} note={s.detail} />)}</div>
      ) : <Quiet>{NO_SHADOWS}</Quiet>}
      <HowTo>Shadow tests trade on paper beside the books to test a candidate; they are never part of a book or its results.</HowTo>
    </Sec>
  );
}
