// Story W3a: today's weather in words, from P1's three examples (good GREEN, bad RED, empty not published). Every figure
// is the payload's: the expected values below are the examples' own numbers, written out by hand.
import assert from "node:assert/strict";
import { test } from "node:test";
import { priceOf, recentOf, redShareOf, scoresOf } from "../record-view.ts";
import { weatherExample } from "../fixture-source.ts";
import { chancesOf, driversOf, upgradesOf, verdictOf } from "../view.ts";

const green = weatherExample("getFnoWeather_india_green");
const red = weatherExample("getFnoWeather_india_red");
const missing = weatherExample("getFnoWeather_india_missing");

test("GREEN allows new paper trades; RED blocks them; the colour always comes with its glyph and meaning", () => {
  const g = verdictOf(green);
  assert.equal(g.kind, "colour");
  assert.ok(g.kind === "colour" && g.look.icon === "check" && g.look.meaning === "Calm" && g.entries === "New paper trades are allowed today.");
  const r = verdictOf(red);
  assert.ok(r.kind === "colour" && r.colour === "RED" && r.look.icon === "block");
  assert.equal(r.entries, "No new paper trade today. Open positions follow their exit plans.");
  assert.match(g.detail, /^Calm · for Mon 16 Nov 2026 · weather-v1$/);
});

test("a weather not published fails closed: no new trade, and the missing input named with its story", () => {
  const m = verdictOf(missing);
  assert.equal(m.kind, "missing");
  assert.ok(m.kind === "missing");
  assert.match(m.entries, /^No new paper trade today: a missing weather blocks new trades, like RED/);
  assert.deepEqual(m.missing, ["India VIX level at 15:00 (A16): No 15-minute snapshot between 14:45 and 15:00 (the recorder's host was down)"]);
  assert.equal(m.detail, "for Mon 16 Nov 2026: not published");
});

test("the two chances against the usual chance, on a scale that ends at 50%", () => {
  const [one, five] = chancesOf(red);
  assert.deepEqual([one.value, one.bar, one.usualAt], ["11.5%", 23, 8.2]);
  assert.equal(one.usual, "Usually 4.1% (last 750 sessions) · 2.8 times the usual chance");
  assert.equal(chancesOf(green)[1].usual, "Usually 13.7% (last 750 sessions) · 0.8 times the usual chance");
  const [none] = chancesOf(missing);
  assert.deepEqual([none.value, none.bar, none.usual], ["—", null, "Usually 4.1% (last 750 sessions)"]);
  assert.equal(five.label, "A 2% move within 5 sessions");
});

test("drivers are the backend's words with the way they pushed; an upgrade's time is shown in IST", () => {
  assert.deepEqual(driversOf(red)[0], { tone: "danger", icon: "trending_up", push: "Riskier", text: "India VIX up 22% over 5 sessions" });
  assert.equal(driversOf(green)[0].push, "Calmer");
  assert.deepEqual(driversOf(missing), []);
  assert.deepEqual(upgradesOf(red), [{ at: "11:45 IST", from: "AMBER", to: "RED", why: "India VIX up 11% since the open" }]);
});

test("the record: the last sessions, RED's share against its 15% maximum, the scores and the price of the RED rule", () => {
  const recent = recentOf(green);
  assert.deepEqual(recent.at(-1), { day: "16 Nov", label: { tone: "success", icon: "check", word: "GREEN" }, outcome: "not known yet", rebuilt: false });
  assert.equal(redShareOf(red).state, "Over-alarming");
  assert.equal(redShareOf(red).words, "RED on 41 of the last 250 sessions (16.4%); the limit is 15%. Above it, a new version must be proposed; RED still blocks until you approve it.");
  assert.equal(redShareOf(missing).words, "RED on 13 of the last 250 sessions rebuilt from history (exploratory) (5.2%); the limit is 15%. Above it, a new version must be proposed; RED still blocks until you approve it.", "a rebuilt share says so");
  assert.deepEqual(scoresOf(green)[0], { question: "Next session", against: "The usual chance", days: "140", needs: "test needs 10", brier: "0.036", brierBaseline: "0.039", verdict: { tone: "success", icon: "check", word: "Better" }, exploratory: null });
});

test("RED's price is Paper and honest: saved, cost, or not measured yet (never a guess)", () => {
  const saved = priceOf(green);
  assert.ok(saved.kind === "measured");
  assert.deepEqual(saved.facts.map((f) => [f.label, f.value]), [["Trades blocked", "2"], ["Risk avoided", "₹7,960"], ["RED saved", "₹1,240"]]);
  const cost = priceOf(red);
  assert.ok(cost.kind === "measured" && cost.facts[2].label === "RED cost" && cost.facts[2].value === "₹4,810");
  assert.deepEqual(priceOf(missing), { kind: "words", text: "Not measured yet: the blocked trades’ shadow results come later." });
});

test("2.8.0's labels: a day, a RED share or a score rebuilt from history is always said to be, never shown as live", () => {
  assert.ok(recentOf(missing).slice(0, -1).every((r) => r.rebuilt) && !recentOf(missing).at(-1)!.rebuilt, "the strip marks rebuilt days, not the unrecorded one");
  assert.ok(recentOf(green).every((r) => !r.rebuilt));
  assert.ok(!redShareOf(green).words.includes("rebuilt"));
  assert.ok(scoresOf(missing).every((s) => s.exploratory === "Exploratory: scored on days rebuilt from history, not a confirmed result"));
  assert.ok(scoresOf(red).every((s) => s.exploratory === null));
});
