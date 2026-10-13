// Story W8 AC6 (logic): the order window's estimates, the snapshot or price check the fill would use, the refusal of
// a contract without executable quotes and the Manual account's limit checks. A preview: no submit path.
import assert from "node:assert/strict";
import { test } from "node:test";
import { executable, fillNote, preview, type OrderInput } from "../order.ts";
import { fmt, frame } from "./helpers.ts";

const india = frame("india").shell;
const us = frame("us").shell;
const input = (o: Partial<OrderInput> = {}): OrderInput => ({ side: "buy", qty: 1, type: "market", limit: null, bracket: false, sl: null, tgt: null, ...o });
const inr = fmt("INR");

test("a stock buy uses the last close, estimates value, charges and cash after, and passes when open", () => {
  const p = preview(india, india.items.RELIANCE, input({ qty: 10 }), null, inr);
  assert.equal(p.price, 1218);
  assert.equal(p.value, 12180);
  assert.ok(p.charges.total > 20 && p.charges.total < 60, String(p.charges.total));
  assert.equal(p.cashAfter, 440900 - 12180 - p.charges.total);
  assert.equal(p.ok, true);
  assert.deepEqual(p.checks.map((c) => c.title), ["Quotes", "Cash available"]);
});

test("the same order with the market closed fails the Market open check first, with the lock's reason", () => {
  const p = preview(india, india.items.RELIANCE, input({ qty: 10 }), "Market closed: you can buy and sell again when it opens Thu 8 Oct 09:15 IST.", inr);
  assert.equal(p.ok, false);
  assert.deepEqual(p.checks[0], { pass: false, title: "Market open", detail: "you can buy and sell again when it opens Thu 8 Oct 09:15 IST." });
});

test("an option buy prices at the snapshot's ask, a sell at its bid; the lot multiplies", () => {
  const ce = india.items.NIFTY26OCT23300CE;
  const buy = preview(india, ce, input(), null, inr);
  assert.equal(buy.price, ce.ask);
  assert.equal(buy.units, 75);
  assert.equal(buy.ok, true, JSON.stringify(buy.checks));
  assert.equal(preview(india, ce, input({ side: "sell" }), null, inr).price, ce.bid);
});

test("a single short call is blocked: unlimited maximum loss", () => {
  const p = preview(india, india.items.NIFTY26OCT22800CE, input({ side: "sell" }), null, inr);
  assert.equal(p.ok, false);
  assert.equal(p.maxLoss, Infinity);
  assert.ok(p.checks.some((c) => !c.pass && c.detail === "unlimited: a single short option"));
});

test("a future (end-of-day prices only) and an option without bid and ask are refused, never priced from a guess", () => {
  assert.equal(executable(india.items.NIFTY26OCTFUT), false);
  assert.equal(executable(india.items.NIFTY26NOV22000PE), false);
  const p = preview(india, india.items.NIFTY26OCTFUT, input(), null, inr);
  assert.equal(p.executable, false);
  assert.equal(p.ok, false);
  assert.deepEqual(p.checks[0], { pass: false, title: "Executable quotes", detail: "none recorded for this contract" });
});

test("selling more shares than the Manual account holds fails (no short selling); an index is not tradable", () => {
  assert.equal(preview(us, us.items.AAPL, input({ side: "sell", qty: 3 }), null, fmt("USD")).ok, true);
  const p = preview(us, us.items.AAPL, input({ side: "sell", qty: 4 }), null, fmt("USD"));
  assert.equal(p.ok, false);
  assert.ok(p.checks.some((c) => c.title.startsWith("Shares held") && c.detail === "4 of 3"));
  assert.equal(executable(india.items.NIFTY50), false);
});

test("the US charges are the US rate table, in dollars", () => {
  const p = preview(us, us.items.NVDA, input({ side: "sell", qty: 2 }), null, fmt("USD"));
  assert.deepEqual(p.charges.rows.map(([k]) => k), ["Commission", "SEC fee (sell)"]);
});

test("a bracket needs a stop-loss below and a target above the price for a buy", () => {
  const it = india.items.RELIANCE;
  assert.equal(preview(india, it, input({ bracket: true, sl: 1100, tgt: 1300 }), null, inr).ok, true);
  assert.equal(preview(india, it, input({ bracket: true, sl: 1300, tgt: 1100 }), null, inr).ok, false);
  assert.equal(preview(india, it, input({ bracket: true }), null, inr).ok, false);
});

test("the fill note names the estimate's basis and what the fill would use", () => {
  assert.equal(fillNote(india, india.items.NIFTY26OCT23300CE, "the Wed 7 Oct 3 pm quotes"), `Estimates use the Wed 7 Oct 3 pm quotes. The fill would use ${india.next_quotes.option}, so the paper fill price, charges and cash can differ.`);
  assert.match(fillNote(india, india.items.RELIANCE, "the 6 Oct close price"), /The fill would use the stock tool's next price check/);
});
