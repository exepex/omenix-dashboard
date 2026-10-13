"use client";
// The order window's inputs (story W8): side (Buy green, Sell red), the account (strategy books listed, never traded
// by hand), quantity or lots, limit price, order type, validity and the optional bracket. Inputs only: the preview
// (lib/shell/order.ts) recomputes from them.
import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { Instrument } from "../../lib/shell/contract.ts";
import { isFno } from "../../lib/shell/market.ts";
import type { OrderInput, Side } from "../../lib/shell/order.ts";
import { HelpTip, Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";

type Validity = "day" | "gtc";
const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v));

function Segmented<T extends string>({ label, value, options, set }: { label: string; value: T; options: [T, string, string?][]; set: (v: T) => void }) {
  return (
    <div className="md-segmented dense" role="group" aria-label={label}>
      {options.map(([k, text, tip]) => (
        <button key={k} type="button" aria-pressed={value === k} data-tip={tip} onClick={() => set(k)}>
          {text}
        </button>
      ))}
    </div>
  );
}

interface Props {
  it: Instrument;
  o: OrderInput;
  setO: Dispatch<SetStateAction<OrderInput>>;
  /** The price the estimate uses (a new limit starts from it). */
  basis: number;
  accountHint: string;
  /** Shown right under the side switch (the refusal, when the contract has no executable quote). */
  afterSide: ReactNode;
}

export function OrderFields({ it, o, setO, basis, accountHint, afterSide }: Props) {
  const { shell, fmt } = useFrame();
  const [validity, setValidity] = useState<Validity>("day");
  const fno = isFno(it.kind);
  const set = (patch: Partial<OrderInput>) => setO((prev) => ({ ...prev, ...patch }));
  const manual = Object.entries(shell.accounts).find(([, a]) => a.kind === "manual")?.[0];
  return (
    <>
      <div className="mb-order-side" role="group" aria-label="Side">
        {(["buy", "sell"] as Side[]).map((s) => (
          <button key={s} type="button" className={s} aria-pressed={o.side === s} onClick={() => set({ side: s })}>
            <Icon name={s === "buy" ? "trending_up" : "trending_down"} />
            {s === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>
      {afterSide}
      <div className="mb-field">
        <label htmlFor="o-acc">Account</label>
        <select className="mb-input" id="o-acc" defaultValue={manual}>
          {Object.entries(shell.accounts).map(([k, a]) => (
            <option key={k} value={k} disabled={a.kind !== "manual"}>
              {a.kind === "manual" ? `${a.name} · cash ${fmt.money(a.cash)}` : `${a.name} (strategy book: not traded by hand)`}
            </option>
          ))}
        </select>
        <span className="hint">
          {`Your own paper account in ${shell.label}: shown beside the strategy books, never part of their scoreboards. `}
          <HelpTip tip={accountHint} />
        </span>
      </div>
      <div className="mb-field-row">
        <div className="mb-field">
          <label htmlFor="o-qty">{fno ? `Lots (lot ${it.lot})` : "Quantity (shares)"}</label>
          <input className="mb-input" id="o-qty" type="number" min={1} step={1} inputMode="numeric" value={o.qty} onChange={(e) => set({ qty: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
        </div>
        <div className="mb-field">
          <label htmlFor="o-lim">Limit price</label>
          <input className="mb-input" id="o-lim" type="number" step={0.05} placeholder="Market" disabled={o.type === "market"} value={o.limit ?? ""} onChange={(e) => set({ limit: num(e.target.value) })} />
        </div>
      </div>
      <div className="mb-field-row">
        <div className="mb-field">
          <span className="l">
            Order type <HelpTip tip="Market: filled at the next valid quotes by the shared fill rules. Limit: filled only if the next valid quotes reach your limit." />
          </span>
          <Segmented label="Order type" value={o.type} options={[["market", "Market"], ["limit", "Limit"]]} set={(type) => set(type === "limit" ? { type, limit: o.limit ?? Number(basis.toFixed(2)) } : { type, limit: null })} />
        </div>
        <div className="mb-field">
          <span className="l">Validity</span>
          <Segmented
            label="Validity"
            value={validity}
            options={[["day", "Day", "Cancelled if not filled by the end of the next valid quotes’ session."], ["gtc", "Until cancelled", "Good till cancelled (GTC): stays open across sessions until filled or you cancel it."]]}
            set={setValidity}
          />
        </div>
      </div>
      <div className="mb-field">
        <label htmlFor="o-brk" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" id="o-brk" checked={o.bracket} onChange={(e) => set({ bracket: e.target.checked })} />
          Add a stop-loss and target (bracket)
        </label>
        <div className="mb-field-row">
          <input className="mb-input" type="number" step={0.05} placeholder="Stop-loss" aria-label="Stop-loss price" disabled={!o.bracket} value={o.sl ?? ""} onChange={(e) => set({ sl: num(e.target.value) })} />
          <input className="mb-input" type="number" step={0.05} placeholder="Target" aria-label="Target price" disabled={!o.bracket} value={o.tgt ?? ""} onChange={(e) => set({ tgt: num(e.target.value) })} />
        </div>
      </div>
    </>
  );
}
