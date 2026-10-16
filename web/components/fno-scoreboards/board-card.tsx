// The F&O scoreboards' cards (story W3h; design/mockups/42-scoreboards 2-boards.js): B and A, each its own card with its
// status, standing, book rows and the do-nothing yardstick; never added together, never one winner across them. Every
// word comes from lib/fno-scoreboards/view.ts.
import type { FnoScoreboards } from "../../lib/fno-scoreboards/contract.ts";
import { boardsOf, NOT_RUN, type BoardView } from "../../lib/fno-scoreboards/view.ts";
import { HowTo, Quiet, Sec } from "../fno-common/screen-bits.tsx";
import { Label, PaperTag } from "../ui/primitives.tsx";
import { BoardTable } from "./board-table.tsx";

function BoardCard({ b }: { b: BoardView }) {
  return (
    <Sec title={<>{b.title}<Label tone={b.status.tone} icon={b.status.icon}>{b.status.word}</Label><PaperTag label="Paper" /></>} aria={b.title}>
      <p className="small muted what">{b.what}</p>
      {b.ran ? (
        <>
          <p className="small standing">{b.standing}</p>
          <BoardTable rows={b.rows} />
          <p className="small yardstick">Doing nothing (a NIFTY index fund with the same money, same days): {b.doNothing ? <Label tone={b.doNothing.tone} icon={b.doNothing.icon}>{b.doNothing.word}</Label> : "—"}</p>
        </>
      ) : <Quiet>{NOT_RUN}</Quiet>}
      <HowTo>Each book is its own row; the rows are never added up. “Beats doing nothing” uses the test frozen before the results were seen.</HowTo>
    </Sec>
  );
}

export function ScoreboardCards({ p }: { p: FnoScoreboards }) {
  return <div className="stack">{boardsOf(p).map((b) => <BoardCard key={b.title} b={b} />)}</div>;
}
