"use client";
// Small parts the frame repeats (story W8): signed change, as-of stamp, approach badge, the ticker link that opens a
// quick view (and a hover card where the device hovers), the Example data tag, the drawer's head. Design-system classes only.
import type { ReactNode } from "react";
import { asOf } from "../../lib/shell/clock.ts";
import { exampleTagShown, stockExampleShown } from "../../lib/shell/labels.ts";
import type { Family, Instrument } from "../../lib/shell/contract.ts";
import { DASH, direction, signed } from "../../lib/ui/format.ts";
import { Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";

/** "+2.66%" in green with its sign, "−7.92%" in red: never colour alone. */
export function Delta({ value, decimals = 2, unit = "%" }: { value: number | null | undefined; decimals?: number; unit?: string }) {
  if (value === null || value === undefined) return <span className="muted">{DASH}</span>;
  return <span className={`mb-delta ${direction(value)}`}>{signed(value, decimals, unit)}</span>;
}

/** "6 Oct close" with the source and freshness in its tooltip; a stale value is greyed and says "stale". */
export function AsOfStamp({ item, icon = true }: { item: Instrument; icon?: boolean }) {
  const { data } = useFrame();
  const a = asOf(item, data);
  return (
    <span className={`mb-asof${a.stale ? " stale" : ""}`} data-tip={a.tip}>
      {icon ? <Icon name={a.stale ? "warning" : "schedule"} /> : null}
      {a.short + (a.stale ? " · stale" : "")}
    </span>
  );
}

/** The approach badge: icon and word, the approach's meaning in this market in its tooltip. */
export function ApBadge({ family }: { family: Family }) {
  const { data, shell } = useFrame();
  const f = data.families[family];
  return (
    <span className={`mb-ap ${family}`} data-tip={`${f.long}: ${shell.family_text[family]}`}>
      <Icon name={f.icon} />
      {f.label}
    </span>
  );
}

/** A ticker or contract: a link to its quick view; hovering it (where the device hovers) shows the hover card. */
export function Tk({ id, children }: { id: string; children?: string }) {
  const { item, openDrawer } = useFrame();
  return (
    <a
      className="tk"
      href="#"
      data-inst={id}
      onClick={(e) => {
        e.preventDefault();
        openDrawer({ kind: "quick", id });
      }}
    >
      {children ?? item(id)?.sym ?? id}
    </a>
  );
}

/** "Example data" on a view of example records; never on a value read from a backend's publication (`item.live`). */
export function ExampleTag({ item }: { item?: Pick<Instrument, "live"> }) {
  const { shell, data } = useFrame();
  if (!exampleTagShown(data, item)) return null;
  return (
    <span className="mb-tag mock" data-tip={shell.example_note}>
      Example data
    </span>
  );
}

/** "Example" beside a stock figure on a screen that also shows the F&O tool's real figures (W9-F&O), so the two kinds
 *  can never be read as one. Absent when everything on the screen is example (the page's own label says so). */
export function StockExampleTag() {
  const { data } = useFrame();
  if (!stockExampleShown(data)) return null;
  return (
    <span className="mb-tag mock" data-tip="Stock figures are example records until the stock tool publishes them; the F&O figures here are the F&O tool’s.">
      Example
    </span>
  );
}

/** The drawer's title row with its close button (Esc also closes). */
/** `subIsName`: the line is a security's name (marked for the model-name gate, which reads names as names). */
export function DrawerHead({ title, sub, subIsName = false, children }: { title: string; sub?: string; subIsName?: boolean; children?: ReactNode }) {
  const { closeDrawer } = useFrame();
  return (
    <div className="mb-drawer-head">
      <div style={{ minWidth: 0 }}>
        <h2 id="drawer-title">{title}</h2>
        {sub ? <div className="sub" data-security={subIsName ? "" : undefined}>{sub}</div> : null}
        {children}
      </div>
      <button className="md-icon-btn" type="button" aria-label="Close (Esc)" onClick={closeDrawer}>
        <Icon name="close" />
      </button>
    </div>
  );
}
