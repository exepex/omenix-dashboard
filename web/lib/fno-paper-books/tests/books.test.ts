// Story W3c: the paper books in words, from P1's three examples (good won, bad lost, empty none). Every figure is the
// payload's: the expected values below are the examples' own numbers, written out by hand. Each book is its own card;
// nothing is added across books.
import assert from "node:assert/strict";
import { test } from "node:test";
import { booksExample } from "../fixture-source.ts";
import { closedOf, NO_CLOSED, openOf } from "../trades-view.ts";
import { booksOf, shadowsOf } from "../view.ts";

const won = booksExample("getFnoPaperTrades_india_won");
const lost = booksExample("getFnoPaperTrades_india_lost");
const none = booksExample("getFnoPaperTrades_india_none");

test("one card per book, in the payload's order, each its own account (no total across books)", () => {
  const cards = booksOf(won);
  assert.deepEqual(cards.map((c) => c.family), ["rule", "hybrid", "ai"]);
  const rule = cards[0];
  assert.deepEqual([rule.value, rule.cash, rule.open, rule.marks], ["₹20,03,054", "₹19,99,414", "1", "at the marks of 16 Nov 2026"]);
  assert.deepEqual(rule.change, { tone: "success", icon: "trending_up", word: "Up +₹3,054" });
  assert.equal(rule.openRisk, "Open risk ₹3,984 (the open positions' maximum losses)");
  assert.ok(!JSON.stringify(cards).includes("60,03,054"), "no sum of the three books' values");
});

test("a losing book says Down with its sign; its distance to the pause is its loss from the high against the published limit", () => {
  const rule = booksOf(lost)[0];
  assert.deepEqual(rule.change, { tone: "danger", icon: "trending_down", word: "Down −₹7,108" });
  assert.equal(rule.brake.words, "₹10,204 below its high; it pauses new trades at ₹1,20,000");
  assert.equal(rule.brake.bar, 8.5);
  assert.equal(booksOf(lost)[1].brake.bar, 0);
});

test("an untouched book is Flat at its opening value", () => {
  for (const c of booksOf(none)) assert.deepEqual([c.value, c.change.word, c.open], ["₹20,00,000", "Flat ₹0", "0"]);
});

test("shadow tests are their own cards; B0 is labelled Measurement", () => {
  assert.deepEqual(shadowsOf(won), [
    { kind: "Measurement", name: "B0 measurement account", detail: "₹20,00,000 · 0 open · since ₹20,00,000" },
    { kind: "Shadow", name: "Call spread test, version 1", detail: "₹20,01,420 · 1 open · since ₹20,00,000" },
  ]);
});

test("an open position: its legs (owner only), the most it can lose, so far, and today's monitor alert in IST", () => {
  const [t] = openOf(won);
  assert.deepEqual(t.legs, ["Buy 1 × 10600 PE", "Sell 1 × 10450 PE"]);
  assert.deepEqual([t.maxLoss, t.soFar.word, t.daysLeft, t.opened], ["₹3,984", "Down −₹42", "29", "16 Nov 2026"]);
  assert.equal(t.alerts.length, 1);
  assert.match(t.alerts[0], /^13:15 IST: F&O monitor: information, no action: /);
});

test("a closed trade: before costs, costs, after costs, and the same decision at 5, 30 and 60 minutes", () => {
  const [t] = closedOf(won);
  assert.deepEqual([t.gross, t.costs, t.net, t.result.word, t.exit, t.held], ["+₹3,310", "₹214", "+₹3,096", "Won", "Took its profit", "2 Nov 2026 to 12 Nov 2026"]);
  assert.deepEqual(t.fills?.map((f) => f.word), ["5 min: +₹3,180", "30 min: +₹3,020", "60 min: +₹2,860"]);
});

test("a fill missed at 60 minutes says why; a trade from before owner-timing fills has none, never made up", () => {
  const [missed, early] = closedOf(lost);
  assert.deepEqual(missed.fills?.map((f) => [f.word, f.tone]), [["5 min: −₹3,984", "success"], ["30 min: −₹3,984", "success"], ["60 min: Missed: the price moved", "warn"]]);
  assert.equal(missed.result.word, "Lost");
  assert.equal(early.fills, null);
});

test("no trade yet: no open position and no closed trade", () => {
  assert.deepEqual([openOf(none), closedOf(none)], [[], []]);
  assert.equal(NO_CLOSED, "No closed trade yet.");
});
