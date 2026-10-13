"use client";
// The F&O part of the picks panel (stories W8, W9-F&O; 30-shell notes "F&O note / example rows"): while no F&O strategy
// has passed testing, the F&O tool's own note; once a book's strategy is approved, its ideas for today (the basket's
// name, chance of profit, most it can lose, credit or debit); with no data, the reason. India only (absent in the US).
// The basket order window is not built yet, so the rows have no Buy.
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";

export function FnoPicksNote() {
  const { shell, data, fmt } = useFrame();
  if (!shell.fno) return null;
  const missing = shell.fno_live?.missing.picks;
  const fs = shell.fno_state;
  if (missing) return <div className="mb-wl-note"><Icon name="science" /><span><b>F&amp;O picks: </b>{missing}</span></div>;
  if (!fs) return null;
  if (!fs.approved) {
    return (
      <div className="mb-wl-note">
        <Icon name="science" />
        <span>
          <b>F&amp;O: no approved strategy yet. </b>
          {fs.note.replace(/^No F&O strategy has passed testing yet: /, "")}
        </span>
      </div>
    );
  }
  return (
    <ul className="mb-wl-list" aria-label="Today’s F&O ideas">
      {(shell.fno_rows ?? []).map((r) => (
        <li key={r.basket} className="mb-wl-note">
          <Icon name="layers" />
          <span>
            <b>{`${data.families[r.family].label} · ${r.name}`}</b>
            {` · ${Math.round(r.pop)}% chance of profit · most it can lose ${fmt.money(r.max_loss)} · ${r.credit !== undefined ? `credit ${fmt.money(r.credit)}` : `debit ${fmt.money(r.debit ?? 0)}`} · Paper`}
          </span>
        </li>
      ))}
    </ul>
  );
}
