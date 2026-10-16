// Story W3d: the Strategy lab's F&O tab in words, from P1's three examples (passed, paused, none). Every figure is the
// payload's: the expected values below are the examples' own, written out by hand.
import assert from "node:assert/strict";
import { test } from "node:test";
import { pageByKey, pageOfPath, pagePath } from "../../ui/routes.ts";
import { labFnoExample } from "../fixture-source.ts";
import { booksOf, factoryOf, headlineOf, realMoneyOf, resultsOf, signedRs } from "../view.ts";

const passed = labFnoExample("getFnoStrategyLab_india_passed");
const paused = labFnoExample("getFnoStrategyLab_india_paused");
const none = labFnoExample("getFnoStrategyLab_india_none");

test("the headline says whether any strategy passed, in the backend's own words", () => {
  assert.deepEqual([headlineOf(passed).word, headlineOf(passed).verdict], ["A strategy passed", "yes-ok"]);
  assert.deepEqual([headlineOf(none).word, headlineOf(none).text], ["No strategy has passed", "No strategy has passed its test yet: 58 ideas tried, 0 passed"]);
});

test("every idea tried is counted, with the passes chance alone would give; only non-zero statuses are listed", () => {
  const f = factoryOf(passed);
  assert.equal(f.words, "64 ideas tried. At a pass level of 1%, about 0.6 would pass by chance alone.");
  assert.deepEqual(f.chips, ["2 ideas", "6 screened out", "2 shadow only", "1 registered", "1 testing", "1 passed", "51 failed"]);
  assert.deepEqual([f.ideas[0].trial, f.ideas[0].status.word, f.ideas[0].restsOn], ["61", "Passed", "Q1"]);
  assert.equal(factoryOf(paused).ideas[1].restsOn, "—");
});

test("each book says what it may trade and why not; costs are the book's, a dash until published", () => {
  const [rule, hybrid] = booksOf(passed);
  assert.deepEqual([rule.approved, rule.trading.word, rule.costs], ["Put spread A, version 1", "Yes", "₹1,850"]);
  assert.deepEqual([hybrid.approved, hybrid.trading.word, hybrid.whyNot], ["None", "No", "Its candidate is still a shadow"]);
  assert.equal(booksOf(passed)[2].costs, "—");
});

test("paper results after every cost: signed, with the glyph and word, each strategy its own line", () => {
  const [r] = resultsOf(passed);
  assert.deepEqual([r.gross, r.costs, r.net.word, r.afterTax, r.vsIndex, r.wonLost], ["+₹21,480", "₹8,132", "Up +₹13,348", "+₹9,183", "+₹2,300", `${passed.results[0].won} won · ${passed.results[0].lost} lost`]);
  const [p] = resultsOf(paused);
  assert.deepEqual([p.status.word, p.net.word, p.vsIndex], ["Paused", "Down −₹30,840", "−₹41,200"]);
  assert.ok(p.pauseReason && p.pauseReason.length > 0);
  assert.deepEqual(resultsOf(none), []);
  assert.equal(signedRs(null), "—");
});

test("real money is never eligible here: every check in words, met, not met or not checked yet", () => {
  assert.equal(passed.real_money.eligible, false);
  assert.deepEqual(realMoneyOf(passed).map((c) => c.look.word), ["Met", "Not met", "Met", "Met", "Not checked yet", "Not checked yet", "Not checked yet"]);
  assert.ok(realMoneyOf(none).every((c) => c.look.word === "Not checked yet"));
});

test("the F&O tab is /india/strategy-lab/fno, outside the navigation, and the Stocks tab keeps /india/strategy-lab", () => {
  assert.equal(pagePath("india", "lab-fno"), "/india/strategy-lab/fno");
  assert.equal(pageOfPath("/india/strategy-lab/fno").key, "lab-fno");
  assert.equal(pageOfPath("/india/strategy-lab").key, "lab");
  assert.deepEqual([pageByKey("lab-fno").nav, pageByKey("lab-fno").mockup, pageByKey("lab-fno").owner], [false, "45-strategy-lab-fno", "W3"]);
});
