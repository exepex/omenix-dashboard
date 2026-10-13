"use client";
// A Home section's head (story W9): title, a short line on what it answers, and the link to its full screen.
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "../frame/frame-context.tsx";

export function SectionHead({ title, sub, go }: { title: string; sub?: string; go?: [label: string, screen: string] }) {
  const { go: open } = useFrame();
  return (
    <div className="sec-head">
      <h2>{title}</h2>
      {sub ? <span className="sub">{sub}</span> : null}
      {go ? (
        <a className="go" href="#" onClick={(e) => { e.preventDefault(); open(go[1]); }}>
          {go[0]}
          <Icon name="chevron_right" />
        </a>
      ) : null}
    </div>
  );
}

/** A profit or loss with its sign and colour (never colour alone). */
export function MoneyDelta({ value, decimals = 2 }: { value: number | null | undefined; decimals?: number }) {
  const { fmt } = useFrame();
  if (value === null || value === undefined) return <span className="muted">—</span>;
  return <span className={`mb-delta ${value > 0 ? "up" : value < 0 ? "down" : "flat"}`}>{fmt.money(value, decimals, true)}</span>;
}
