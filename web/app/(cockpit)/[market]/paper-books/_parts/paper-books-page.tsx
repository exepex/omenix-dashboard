// The paper books' layout (story W3c; 41-paper-books 9-mount.js): the head, how current the F&O data is, then the
// books, the shadow tests and the trades, read once through the PaperBooksData interface (lib/fno-paper-books/wiring.ts
// chooses the adapter). Each book is its own account: nothing is added across books. The examples say Example through
// the frame's rule.
import { blockSection } from "../../../../../components/blocks/block-section.tsx";
import { ExampleTag } from "../../../../../components/frame/parts.tsx";
import { Part } from "../../../../../components/blocks/part.tsx";
import { FramePageHead } from "../../../../../components/ui/frame-page-head.tsx";
import { Icon } from "../../../../../components/ui/icon.tsx";
import { PaperTag } from "../../../../../components/ui/primitives.tsx";
import { PaperBookCards, PaperShadows } from "../../../../../components/fno-paper-books/paper-books-accounts.tsx";
import { PaperClosed, PaperOpen } from "../../../../../components/fno-paper-books/paper-books-trades.tsx";
import { paperBooksData, paperBooksLive } from "../../../../../lib/fno-paper-books/wiring.ts";
import { FreshnessBlock } from "../../_fno/freshness-block.tsx";
import { HeldBlock } from "../../_fno/held-block.tsx";
import "../../../../../components/fno-common/fno-screen.css";
import "./paper-books.css";

const LEDE = "Three paper books trade F&O on their own: Rule-based, Hybrid and the AI team. Each has its own paper account, so their results are never added together. No real order is ever placed.";

const BooksBlock = () =>
  blockSection("The paper books", () => paperBooksData.trades(), (p) => (
    <>
      <PaperBookCards p={p} />
      <div className="stack"><PaperShadows p={p} /></div>
      <div className="stack"><PaperOpen p={p} /><PaperClosed p={p} /></div>
    </>
  ));

export function PaperBooksPage() {
  const meta = (
    <>
      <span className="md-chip small"><Icon name="public" />India · F&amp;O · NIFTY</span>
      <PaperTag label="Paper" />
      <ExampleTag item={{ live: paperBooksLive }} />
    </>
  );
  return (
    <div className="fno-screen paper-books">
      <FramePageHead crumbs={["Portfolio", "Paper books"]} title="Paper books" meta={meta} />
      <p className="lede">{LEDE}</p>
      <Part label="how current the data is"><FreshnessBlock /></Part>
      <Part label="the paper books"><HeldBlock pageKey="paper_trades"><BooksBlock /></HeldBlock></Part>
      <div className="src" role="note" aria-label="Where the figures come from">
        <span className="mb-asof" data-tip="exepex/trading's F&O publication, page paper_trades (stories E1, E4, E7, E8)"><Icon name="schedule" />F&amp;O publication: paper trades</span>
        <span className="mb-tag" data-tip="After each fill or exit; marks after the close of each NSE session.">Not live</span>
      </div>
    </div>
  );
}
