// The AI books' and roles' minutes this month against the cap (story W3g; design/mockups/43-budget 2-budget.js): the
// level, used and cap, a bar and the note. Minutes only. Every word comes from lib/fno-budget/view.ts.
import type { FnoBudget } from "../../lib/fno-budget/contract.ts";
import { capOf } from "../../lib/fno-budget/view.ts";
import { HowTo, Sec } from "../fno-common/screen-bits.tsx";
import { Icon } from "../ui/icon.tsx";
import { Label } from "../ui/primitives.tsx";

const Fact = ({ f }: { f: { k: string; v: string; note: string } }) => <div className="mb-fact"><span className="k">{f.k}</span><b>{f.v}</b><small>{f.note}</small></div>;

export function BudgetCap({ b }: { b: FnoBudget }) {
  const c = capOf(b);
  return (
    <Sec title={<>AI books and roles this month<Label tone={c.level.tone} icon={c.level.icon}>{c.level.word}</Label></>} aria="AI books and roles this month">
      <div className="facts2"><Fact f={c.used} /><Fact f={c.cap} /></div>
      <div className="cap">
        <div className="bar" role="img" aria-label={c.aria}>{c.bar === null ? null : <i style={{ width: `${c.bar}%` }} />}</div>
        <small className="muted">{c.words}</small>
      </div>
      {c.note ? <p className="small note"><Icon name="info" /> {c.note}</p> : null}
      <HowTo>The budget is counted in minutes of AI sessions, not money. The AI books and roles may use only a set share of all measured minutes.</HowTo>
    </Sec>
  );
}
