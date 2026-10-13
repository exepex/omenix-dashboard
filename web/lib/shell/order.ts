// The order window's preview (story W8; 30-shell "Order window", design/mockups/_platform/js/5-order.js): estimates
// labelled as estimates, the price check or snapshot the fill would use, and the checks against the Manual account's
// limits. A preview only: nothing here submits, records or sends an order (paper orders need the Manual account and
// its store, a later story). An F&O contract is executable only from the 3 pm snapshot with a bid and an ask. Pure.
import type { Account, Instrument, IndiaRates, MarketShell, UsRates } from "./contract.ts";
import { isFno, tradable } from "./market.ts";

export type Side = "buy" | "sell";

export interface OrderInput {
  side: Side;
  /** Shares, or lots for F&O. */
  qty: number;
  type: "market" | "limit";
  limit: number | null;
  bracket: boolean;
  sl: number | null;
  tgt: number | null;
}

export interface Check {
  pass: boolean;
  title: string;
  detail: string;
}

export interface Preview {
  executable: boolean;
  /** The unit price the estimate uses. */
  price: number;
  units: number;
  value: number;
  charges: { rows: [string, number][]; total: number };
  maxLoss: number | null;
  margin: number | null;
  cashAfter: number;
  checks: Check[];
  /** Every check passes and the market is open. Still a preview: there is no submit path. */
  ok: boolean;
}

export const manualAccount = (shell: MarketShell): [string, Account] => {
  const found = Object.entries(shell.accounts).find(([, a]) => a.kind === "manual");
  if (!found) throw new Error(`no manual account in ${shell.label}`);
  return found;
};

/** Executable quotes: stocks from the stock tool's next price check; F&O only from the recorded 3 pm snapshot. */
export const executable = (it: Instrument) =>
  tradable(it.kind) && (!isFno(it.kind) || (it.kind === "option" && it.source === "snap3pm" && it.bid != null && it.ask != null));

/** The price the estimate starts from: the ask to buy and the bid to sell an option, else the last price. */
export const basis = (it: Instrument, side: Side) => (it.kind === "option" ? (side === "buy" ? it.ask : it.bid) : it.last) ?? 0;

export const defaultQty = (shell: MarketShell, it: Instrument) => (isFno(it.kind) ? 1 : shell.currency === "INR" ? 10 : 2);

/** Charges of an order value (estimate from the payload's example rate table). */
export function charges(shell: MarketShell, it: Instrument, side: Side, value: number): Preview["charges"] {
  if (shell.currency === "USD") {
    const r = shell.charges.equity as UsRates;
    const sec = side === "sell" ? (value * r.sec_sell_pct) / 100 : 0;
    return { rows: [["Commission", r.commission_flat], ["SEC fee (sell)", sec]], total: r.commission_flat + sec };
  }
  const r = (isFno(it.kind) ? shell.charges.option : shell.charges.equity_delivery) as IndiaRates;
  const exch = (value * r.exchange_pct) / 100;
  const sebi = (value * r.sebi_pct) / 100;
  const stt = isFno(it.kind) ? (side === "sell" ? (value * (r.stt_sell_pct ?? 0)) / 100 : 0) : (value * (r.stt_pct ?? 0)) / 100;
  const stamp = side === "buy" ? (value * r.stamp_buy_pct) / 100 : 0;
  const gst = ((r.brokerage_flat + exch + sebi) * r.gst_pct) / 100;
  const rows: [string, number][] = [["Brokerage", r.brokerage_flat], ["STT", stt], ["Exchange charges", exch], ["GST", gst], ["Stamp duty", stamp], ["SEBI fee", sebi]];
  return { rows, total: rows.reduce((a, [, v]) => a + v, 0) };
}

type Money = (x: number) => string;
/** The market's money and price formatters (lib/ui/format.ts), so the check details read like the rest of the frame. */
export interface Formats {
  money: Money;
  price: Money;
}

function fnoChecks(shell: MarketShell, acc: Account, side: Side, value: number, total: number, qty: number, money: Money) {
  const L = shell.limits;
  const maxLoss = side === "buy" ? value + total : Infinity;
  const margin = side === "buy" ? value + total : (shell.short_option_margin_per_lot ?? 0) * qty;
  const unlimited = maxLoss === Infinity;
  const cap = (x: number | null) => x ?? Infinity;
  const checks: Check[] = [
    { pass: maxLoss <= cap(L.max_loss_per_trade), title: `Maximum loss ≤ ${money(cap(L.max_loss_per_trade))} a trade`, detail: unlimited ? "unlimited: a single short option" : money(maxLoss) },
    { pass: (acc.open_structures ?? 0) + 1 <= cap(L.max_open_structures), title: `Open structures ≤ ${L.max_open_structures}`, detail: `${acc.open_structures ?? 0} open + this one` },
    { pass: !unlimited && (acc.at_risk ?? 0) + maxLoss <= cap(L.max_at_risk), title: `At risk ≤ ${money(cap(L.max_at_risk))}`, detail: unlimited ? "unlimited" : `${money(acc.at_risk ?? 0)} + ${money(maxLoss)}` },
    { pass: margin <= (acc.cash ?? 0), title: "Margin estimate within cash", detail: `${money(margin)} of ${money(acc.cash ?? 0)}` },
  ];
  return { maxLoss, margin, checks };
}

/** The preview of an order on the Manual account; `lock` is the market's trade lock (market.ts), or null. */
export function preview(shell: MarketShell, it: Instrument, o: OrderInput, lock: string | null, fmt: Formats): Preview {
  const { money, price: px } = fmt;
  const [manualId, acc] = manualAccount(shell);
  const fno = isFno(it.kind);
  const exe = executable(it);
  const price = o.type === "limit" && o.limit ? o.limit : basis(it, o.side);
  const units = o.qty * (it.lot ?? 1);
  const value = price * units;
  const ch = charges(shell, it, o.side, value);
  const checks: Check[] = [];
  if (!exe) checks.push({ pass: false, title: "Executable quotes", detail: fno ? "none recorded for this contract" : "not tradable" });
  else checks.push({ pass: true, title: fno ? "Executable quotes" : "Quotes", detail: fno ? `3 pm snapshot: bid ${px(it.bid ?? 0)} · ask ${px(it.ask ?? 0)}` : "the stock tool prices this stock" });
  if (o.qty < 1) checks.push({ pass: false, title: "Quantity", detail: "at least 1" });
  let maxLoss: number | null = null;
  let margin: number | null = null;
  if (exe && fno) {
    const f = fnoChecks(shell, acc, o.side, value, ch.total, o.qty, money);
    ({ maxLoss, margin } = f);
    checks.push(...f.checks);
  } else if (exe && o.side === "buy") {
    checks.push({ pass: value + ch.total <= (acc.cash ?? 0), title: "Cash available", detail: `${money(value + ch.total)} of ${money(acc.cash ?? 0)}` });
  } else if (exe) {
    const owned = it.held && it.held.account === manualId ? it.held.qty : 0;
    checks.push({ pass: o.qty <= owned, title: "Shares held in Manual (no short selling)", detail: `${o.qty} of ${owned}` });
  }
  if (o.bracket) {
    const around = o.sl != null && o.tgt != null && (o.side === "buy" ? o.sl < price && o.tgt > price : o.sl > price && o.tgt < price);
    checks.push({ pass: around, title: "Stop-loss and target around the price", detail: o.sl != null && o.tgt != null ? `${px(o.sl)} / ${px(o.tgt)}` : "enter both" });
  }
  if (lock) checks.unshift({ pass: false, title: "Market open", detail: lock.replace(/^Market closed: /, "") });
  const cashAfter = (acc.cash ?? 0) + (o.side === "buy" ? -(value + ch.total) : value - ch.total);
  return { executable: exe, price, units, value, charges: ch, maxLoss, margin, cashAfter, checks, ok: !lock && exe && checks.every((c) => c.pass) };
}

/** What the estimate uses and what the fill would use (the snapshot or the price check). */
export function fillNote(shell: MarketShell, it: Instrument, asOfWords: string): string {
  const next = it.kind === "option" ? shell.next_quotes.option : shell.next_quotes.stock;
  return `Estimates use ${asOfWords}. The fill would use ${next}, so the paper fill price, charges and cash can differ.`;
}
