"use client";
// The order window (story W8; 30-shell "Order window"), as a PREVIEW: the Manual paper account, quantity, type,
// validity and bracket; estimates labelled as estimates; the snapshot or price check the fill would use; the checks
// against the account's limits; a refusal where our data has no executable quote. There is no submit path: the foot's
// button is always disabled and has no action (submitting paper orders needs the Manual account and its store, a later
// story). Nothing here sends, records or places an order.
import { useState } from "react";
import { asOf, dateShort } from "../../lib/shell/clock.ts";
import type { Instrument } from "../../lib/shell/contract.ts";
import { isFno, tradable } from "../../lib/shell/market.ts";
import { defaultQty, fillNote, manualAccount, preview, type OrderInput, type Side } from "../../lib/shell/order.ts";
import { HelpTip, Icon } from "../ui/icon.tsx";
import { useFrame } from "./frame-context.tsx";
import { OrderFields } from "./order-fields.tsx";
import { AsOfStamp, Delta, DrawerHead } from "./parts.tsx";

function Refusal({ it }: { it: Instrument }) {
  return (
    <div className="mb-alert danger" role="alert">
      <Icon name="block" />
      <div>
        <b className="t">Refused: no executable quote</b>
        <div className="s">
          {tradable(it.kind)
            ? `Our data has no bid and ask for ${it.sym}. Paper F&O orders are filled only from the recorded NIFTY monthly option snapshots (3 pm); this contract has ${it.source === "eod" ? "end-of-day prices only" : "no recorded quotes"}, so it is refused, never filled from a guessed price.`
            : "An index is not an instrument: trade its futures or options."}
        </div>
      </div>
      <span />
    </div>
  );
}

export function OrderWindow({ it, side }: { it: Instrument; side: Side }) {
  const { data, shell, lock, fmt } = useFrame();
  const [o, setO] = useState<OrderInput>({ side, qty: defaultQty(shell, it), type: "market", limit: null, bracket: false, sl: null, tgt: null });
  const p = preview(shell, it, o, lock, { money: (x) => fmt.money(x), price: (x) => fmt.price(x) });
  const fno = isFno(it.kind);
  const [, acc] = manualAccount(shell);
  const basisWords = it.kind === "option" ? `the ${dateShort(it.as_of, shell)} 3 pm quotes` : `the ${asOf(it, data).short} price`;
  const priceLabel = o.type === "limit" ? "Limit price" : it.kind === "option" ? `${o.side === "buy" ? "Ask" : "Bid"} at the ${dateShort(it.as_of, shell)} 3 pm snapshot` : `Last price, ${asOf(it, data).short}`;
  const summary = p.executable ? (
    <>
      <dl className="mb-order-sum">
        <dt>{priceLabel}</dt>
        <dd>{fmt.price(p.price)}</dd>
        <dt>{fno ? `Quantity (${o.qty} lot${o.qty === 1 ? "" : "s"} × ${it.lot})` : "Quantity"}</dt>
        <dd>{p.units}</dd>
        <dt>{`${fno && it.kind === "option" ? "Premium" : "Order value"} (estimate)`}</dt>
        <dd>{fmt.money(p.value, 2)}</dd>
        <dt>
          Charges (estimate) <HelpTip tip={`${shell.charges.label}. ` + p.charges.rows.map(([k, v]) => `${k} ${fmt.money(v, 2)}`).join(" · ")} />
        </dt>
        <dd>{fmt.money(p.charges.total, 2)}</dd>
        {p.maxLoss !== null ? (
          <>
            <dt>Maximum loss (estimate)</dt>
            <dd>{p.maxLoss === Infinity ? "Unlimited" : fmt.money(p.maxLoss, 2)}</dd>
            <dt>
              Margin estimate <HelpTip tip="From our recorded margin source (labelled): for a bought option the premium paid; for a sold option a per-lot estimate. Example value." />
            </dt>
            <dd>{fmt.money(p.margin, 0)}</dd>
          </>
        ) : null}
        <dt className="tot">Cash after (estimate)</dt>
        <dd className="tot">{fmt.money(p.cashAfter, 2)}</dd>
      </dl>
      <div className="mb-asof mb-frame-note" data-fill="basis">
        <Icon name="schedule" />
        {fillNote(shell, it, basisWords)}
      </div>
    </>
  ) : (
    <Refusal it={it} />
  );
  const checks = (
    <div>
      <div className="mb-micro" style={{ marginBottom: 6 }}>Checks against the Manual account’s limits</div>
      <ul className="mb-checks">
        {p.checks.map((c) => (
          <li key={c.title} className={c.pass ? "ok" : "fail"}>
            <span className={`mb-mark ${c.pass ? "ok" : "no"}`}><Icon name={c.pass ? "check" : "close"} /></span>
            <span>
              {c.title}
              <span className="vh">{c.pass ? " passed" : " failed"}</span>
              <small>{c.detail}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
  const footWord = lock ? "Market closed" : !p.executable ? "Refused: no executable quote" : !p.ok ? "Blocked by a limit check" : "Preview only";
  return (
    <>
      <DrawerHead title={fno ? "F&O order" : "Order"}>
        <div className="mb-frame-row" style={{ marginTop: 4 }}>
          <b>{it.sym}</b>
          <span className="muted">{fmt.price(it.last)}</span>
          <Delta value={it.chg_pct} />
          <AsOfStamp item={it} />
        </div>
      </DrawerHead>
      <div className="mb-drawer-body">
        <OrderFields it={it} o={o} setO={setO} basis={p.price} accountHint={`Starting capital ${fmt.money(acc.capital)}. ${data.limits_note}`} afterSide={p.executable ? null : summary} />
        {p.executable ? summary : null}
        {checks}
        <div className="mb-asof mb-frame-note">
          <Icon name="info" />
          {`No real order is placed. This window is a preview: submitting paper orders comes with the Manual account; the ${fno ? "F&O tool" : "stock tool"} will fill them only from valid quotes with the strategies’ own fill rules.`}
        </div>
      </div>
      <div className="mb-drawer-foot">
        <button className={`md-btn filled ${o.side}`} type="button" disabled aria-disabled="true" style={{ height: 44 }} data-submit="none">
          <Icon name={lock ? "lock" : p.ok ? "visibility" : "block"} />
          {footWord}
        </button>
        <div className="muted" style={{ fontSize: 12, textAlign: "center" }}>
          {p.ok ? "Every check passes. Nothing is sent: paper orders are not submitted from this window yet." : "Nothing is recorded or sent; every check must pass first."}
        </div>
      </div>
    </>
  );
}
