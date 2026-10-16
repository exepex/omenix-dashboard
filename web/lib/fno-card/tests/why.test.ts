// Story W3f: the card's "why and how sure" and its record, from P1's five examples. Expected values are the examples'
// own numbers, written out by hand; live and back-fill records are always said apart.
import assert from "node:assert/strict";
import { test } from "node:test";
import { cardExample } from "../fixture-source.ts";
import { missesOf, onRecordOf, stressOf, tradesSoFarOf } from "../record-view.ts";
import { advocateOf, checksOf, evidenceOf, forecastOf, hashesOf, stayOutOf, weatherOf } from "../why-view.ts";

const trade = cardExample("getFnoCard_india_trade");
const watch = cardExample("getFnoCard_india_watch");
const red = cardExample("getFnoCard_india_red");
const missing = cardExample("getFnoCard_india_missing");
const none = cardExample("getFnoCard_india_none");

test("the weather with its glyph and word; no weather says so", () => {
  assert.deepEqual(weatherOf(red).look, { tone: "danger", icon: "block", word: "RED" });
  assert.deepEqual(weatherOf(missing).look, { tone: "neutral", icon: "remove", word: "No weather" });
});

test("the forecast with its live and back-fill records apart; none when the card rests on none", () => {
  const f = forecastOf(trade);
  assert.deepEqual([f?.chance, f?.bar], ["38%", 38]);
  assert.equal(f?.record, "House forecast (the baselines). Live: it said 30% to 40% on 9 days; it happened on 44% (24 scored). Back-fill (made after the fact, not live): it said 30% to 40% on 140 days; it happened on 41% (670 scored).");
  assert.equal(forecastOf(missing), null);
});

test("the advocate: answered with objections and its verdict; unavailable never invents one", () => {
  const a = advocateOf(trade);
  assert.deepEqual([a.head.word, a.objections.length, a.verdict?.word], ["Answered", 3, "No hard-rule breach"]);
  const w = advocateOf(watch);
  assert.deepEqual([w.head.word, w.objections, w.empty, w.verdict], ["Did not answer in time", [], "The card went out with the code checks only; no objection is ever invented.", null]);
});

test("data checks: failed with each missing input named", () => {
  const k = checksOf(missing);
  assert.equal(k.head.word, "Failed");
  assert.deepEqual(k.inputs.map((m) => m.story), ["A4", "A16"]);
  assert.equal(checksOf(trade).inputs.length, 0);
});

test("the rungs: TRADE is on rung 3, NO TRADE on none; real money is never eligible", () => {
  assert.deepEqual(evidenceOf(trade).rungs.filter((r) => r.on).map((r) => r.n), [3]);
  assert.deepEqual(evidenceOf(red).rungs.filter((r) => r.on), []);
  assert.equal(evidenceOf(trade).realMoney.word, "Real money: not eligible");
});

test("the price of staying out, NO TRADE only", () => {
  assert.deepEqual([stayOutOf(trade), stayOutOf(red), stayOutOf(none)], [null, "Not measured yet: the shadow fills of the skipped trade come later.", "Nothing was skipped: no approved strategy wanted a trade."]);
  const measured = (net: number) => stayOutOf({ ...red, price_of_staying_out: { status: "measured", shadow_net: net } });
  assert.deepEqual([measured(-1500), measured(800), measured(0)], ["Staying out saved ₹1,500 on paper.", "Staying out cost ₹800 on paper.", "Staying out made no difference on paper."]);
});

test("paper trades so far are counts per book; the stress line names each scenario against the ceiling", () => {
  assert.deepEqual(tradesSoFarOf(trade).books.map((b) => [b.k, b.v]), [["Rule-based (Book 1)", "38"], ["Hybrid (Book 2)", "0"], ["AI team (Book 3)", "0"]]);
  const s = stressOf(red);
  assert.equal(s.head, "2 open paper positions; together they can lose at most ₹7,968.");
  assert.deepEqual(s.lines.map((l) => [l.words, l.bar]), [["NIFTY −5%, India VIX +50%: lose ₹5,320", 66.8], ["NIFTY −10%, India VIX +100%: lose ₹7,968", 100], ["NIFTY +5%, volatility unchanged: lose ₹640", 8]]);
  assert.deepEqual(stressOf(none).lines.map((l) => l.bar), [0, 0, 0]);
});

test("a late capture says its forecasts are not scored; gaps and earlier misses are counted", () => {
  const r = onRecordOf(missing);
  assert.equal(r?.late, " Generated at 19:27 IST, after the 15:15 deadline: these forecasts are not scored.");
  assert.equal(onRecordOf(trade)?.rows[1].live, "not enough data yet (0 scored).");
  assert.deepEqual(missesOf(missing), { count: "4", missing: missing.missing, earlier: "no card on record for 2026-11-13" });
  assert.equal(missesOf(trade), null);
});

test("the records behind the card: file name and the start of its SHA-256", () => {
  assert.deepEqual(hashesOf(trade)[0], { short: "2026-11-16.json 45d3bad04bae", tip: "journal/book1_rules/decisions/2026-11-16.json 45d3bad04bae0a3e99c73efa21c9986541c8877690494be1c2de7b0319b25e28" });
});
