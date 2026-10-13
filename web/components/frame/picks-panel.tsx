"use client";
// Today's buy picks panel (story W8; 30-shell): left on desktop (>= 1200 px), an overlay below that, the Picks tab on a
// phone. Each approach's pick for today with its evidence; filter chips and pages (6 a page) instead of a second
// search box; the no-pick note; in India the F&O state ("no approved strategy yet"). The F&O note is absent in the US.
import { useEffect, useState } from "react";
import type { Signal } from "../../lib/shell/contract.ts";
import { HelpTip, Icon } from "../ui/icon.tsx";
import { useFrame, type Approach } from "./frame-context.tsx";
import { PickRow } from "./pick-row.tsx";

const PAGE = 6;

function Chips() {
  const { data, approach, setApproach } = useFrame();
  const chip = (k: Approach, label: string) => (
    <button key={k} className="md-chip filter small" type="button" aria-pressed={approach === k} onClick={() => setApproach(k)}>
      {label}
    </button>
  );
  return (
    <div className="mb-wl-chips" role="group" aria-label="Who picked">
      {chip("all", "All")}
      {chip("rule", data.families.rule.label)}
      {chip("hybrid", data.families.hybrid.label)}
      {chip("ai", data.families.ai.label)}
    </div>
  );
}

function Empty({ hybrid }: { hybrid: boolean }) {
  const { shell } = useFrame();
  return (
    <li className="quiet" style={{ margin: 12 }}>
      {hybrid ? `No hybrid pick yet: a hybrid stock strategy is planned${shell.fno ? ", and no F&O strategy (Book 2) is approved yet" : ""}.` : "No pick from this approach today."}
    </li>
  );
}

/** The picks: head, rows, notes and pager; the frame's left panel and Home (below 1200 px) both show it. */
export function PicksBody({ where }: { where: "panel" | "home" }) {
  const { shell, approach, picksOpen, setPicksOpen } = useFrame();
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [approach, shell]);
  const rows: Signal[] = shell.signals.filter((x) => approach === "all" || x.family === approach);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const at = Math.min(page, pages - 1);
  const shown = rows.slice(at * PAGE, at * PAGE + PAGE);
  const G = shell.go_live;
  const fs = shell.fno_state;
  return (
    <>
      <div className="mb-wl-head">
        <div className="mb-wl-title">
          <h2>Today’s buy picks</h2>
          <HelpTip tip={`The head-to-head picks of each strategy family for today's session, from the stock tool. Not proven yet: ${G.months_forward} of 2 months of forward paper trading and about ${G.trades_needed} more settled trades are needed before any signal can be called strong.`} />
          {where === "panel" && picksOpen ? (
            <button className="md-icon-btn small" type="button" aria-label="Close the picks" onClick={() => setPicksOpen(false)}>
              <Icon name="close" />
            </button>
          ) : null}
        </div>
        <Chips />
        <div className="mb-wl-meta">
          <span>{`Not proven yet · ${G.trades_needed} trades to go`}</span>
        </div>
      </div>
      <ul className="mb-wl-list" aria-label="Today’s buy picks">
        {shown.map((x) => (
          <PickRow key={`${x.family}:${x.id}`} x={x} />
        ))}
        {shown.length ? null : <Empty hybrid={approach === "hybrid"} />}
      </ul>
      {shell.no_pick.length && approach !== "hybrid" ? (
        <div className="mb-wl-note">
          <Icon name="remove" />
          <span>
            <b>{shell.no_pick.join(", ") + ": "}</b>no strategy picks it today (no candidate clears the bar).
          </span>
        </div>
      ) : null}
      {shell.fno && fs && !fs.approved ? (
        <div className="mb-wl-note">
          <Icon name="science" />
          <span>
            <b>F&amp;O: no approved strategy yet. </b>
            {fs.note.replace(/^No F&O strategy has passed testing yet: /, "")}
          </span>
        </div>
      ) : null}
      <div className="mb-wl-foot mb-pager">
        <span>{rows.length ? `${at * PAGE + 1}–${at * PAGE + shown.length} of ${rows.length}` : "0 of 0"}</span>
        <button className="md-icon-btn small" type="button" aria-label="Previous page" disabled={at === 0} onClick={() => setPage(at - 1)}>
          <Icon name="chevron_left" />
        </button>
        <button className="md-icon-btn small" type="button" aria-label="Next page" disabled={at >= pages - 1} onClick={() => setPage(at + 1)}>
          <Icon name="chevron_right" />
        </button>
      </div>
    </>
  );
}

export function PicksPanel() {
  return (
    <aside className="mb-wl mb-sig" id="wl" aria-label="Today’s buy picks">
      <PicksBody where="panel" />
    </aside>
  );
}
