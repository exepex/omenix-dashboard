// Story W3f: today's card in words, from P1's five examples (TRADE, WATCH, NO TRADE for RED, NO TRADE for missing
// data, and the empty case: NO TRADE, no strategy has passed, as a TEST post). Every figure is the payload's: the
// expected values below are the examples' own numbers, written out by hand.
import assert from "node:assert/strict";
import { test } from "node:test";
import { cardExample } from "../fixture-source.ts";
import { positionOf } from "../position-view.ts";
import { headerOf, timesOf } from "../view.ts";

const trade = cardExample("getFnoCard_india_trade");
const watch = cardExample("getFnoCard_india_watch");
const red = cardExample("getFnoCard_india_red");
const none = cardExample("getFnoCard_india_none");

test("the verdict: its word, glyph and reason, the session, and when the card goes stale", () => {
  const h = headerOf(trade);
  assert.deepEqual([h.status, h.verdict, h.icon, h.why, h.label, h.test], ["TRADE", "yes-ok", "check", "Paper trade today: Put spread A, version 1 (rule-based)", "PAPER ONLY", null]);
  assert.equal(h.detail, "A paper trade today · Mon 16 Nov 2026 · NSE regular session · valid until 15:25 IST");
  assert.deepEqual([headerOf(watch).verdict, headerOf(red).verdict, headerOf(red).icon], ["watch", "no", "block"]);
});

test("a TEST post says so", () => {
  assert.equal(headerOf(none).test, "TEST post: a one-off check of live delivery, not the day’s card.");
});

test("the three times in their order, in IST, then the delivery", () => {
  const t = timesOf(trade);
  assert.deepEqual(t.times.map((x) => [x.k, x.v]), [["1. Market data frozen", "15:00 IST"], ["2. Decision final", "15:06 IST"], ["3. Card sent", "15:08 IST"]]);
  assert.deepEqual(t.delivery, { tone: "success", icon: "check", word: "Sent" });
  const unsent = timesOf({ ...trade, timing: { ...trade.timing, card_sent_at: null, delivery: "not_sent" } });
  assert.deepEqual([unsent.times[2].v, unsent.delivery.word], ["not sent", "Alert NOT sent"]);
});

test("the position: legs, the entry range drawn on its scale, size, the most it can lose against its cap, costs", () => {
  const p = positionOf(trade);
  assert.ok(p);
  assert.equal(p.title, "The paper position");
  assert.deepEqual(p.legs.map((l) => [l.side.word, l.type, l.strike, l.expiry, l.lots]), [["Buy", "put", "10,600", "Tue 29 Dec 2026", "1"], ["Sell", "put", "10,450", "Tue 29 Dec 2026", "1"]]);
  assert.deepEqual([p.entry.words, p.entry.okFrom, p.entry.okWidth, p.entry.stopAt], ["Entry: pay ₹52.00 to ₹58.00 a unit", 37.1, 21.5, 58.6]);
  assert.deepEqual(p.entry.keys, ["Cheaper", "Do not enter above ₹58.00", "Dearer"]);
  assert.equal(p.entry.validity, "Prices from the 15:00 bid and ask. The card is valid until 15:25 IST; after that it is stale.");
  assert.deepEqual(p.size.map((f) => f.v), ["1 lot (65 units)", "₹29,500", "No real money"]);
  assert.deepEqual(p.maxLoss, { words: "The most it can lose: ₹3,984, charges included", bar: 39.8, aria: "40% of the ₹10,000 cap", note: "40% of the ₹10,000 a trade may lose. Fixed at entry: no stop-loss order is needed." });
  assert.deepEqual(p.costs.map((f) => f.v), ["₹214", "₹61.30 a unit", "31.2%"]);
  assert.deepEqual(p.worstCases, ["The worst 5 sessions of March 2020: loss ₹3,984", "The week of 4 June 2024: loss ₹3,984"]);
  assert.equal(p.volEdge, null);
});

test("the cap is the payload's own: a different cap moves the bar and the words (no copy in the screen)", () => {
  const smaller = { ...trade, trade: { ...trade.trade!, max_loss_cap: 5000 } };
  assert.deepEqual([positionOf(smaller)!.maxLoss.bar, positionOf(smaller)!.maxLoss.aria], [79.7, "80% of the ₹5,000 cap"]);
});

test("a credit entry stops at its low end", () => {
  const credit = { ...trade, trade: { ...trade.trade!, entry: { ...trade.trade!.entry, kind: "credit" as const } } };
  const e = positionOf(credit)!.entry;
  assert.deepEqual([e.stopAt, e.keys[1]], [e.okFrom, "Do not enter below ₹52.00"]);
});

test("WATCH is a shadow position; NO TRADE carries none", () => {
  assert.equal(positionOf(watch)?.title, "The shadow position (never traded)");
  assert.equal(positionOf(red), null);
  assert.equal(positionOf(none), null);
});
