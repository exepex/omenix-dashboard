// Story W3g: the AI usage and budget in words, from P1's three examples (good ok, bad alert, empty none). Every figure is
// the payload's: the expected values below are the examples' own numbers, written out by hand. Minutes only, and no
// copy of BG1's alert share or cap share on screen.
import assert from "node:assert/strict";
import { test } from "node:test";
import { budgetExample, BUDGET_EXAMPLES } from "../fixture-source.ts";
import { capOf, groupsOf } from "../view.ts";

const ok = budgetExample("getFnoBudget_india_ok");
const alert = budgetExample("getFnoBudget_india_alert");
const none = budgetExample("getFnoBudget_india_none");

test("within budget: used, the cap out of its basis, the bar at the payload's share", () => {
  const c = capOf(ok);
  assert.deepEqual(c.level, { tone: "success", icon: "check", word: "Within budget" });
  assert.deepEqual([c.used.v, c.used.note, c.cap.v, c.cap.note], ["312 min", "in November 2026", "920 min", "out of 1,840 min measured"]);
  assert.deepEqual([c.bar, c.aria], [33.9, "34% of the cap used"]);
  assert.equal(c.note, null);
});

test("past the alert: the level says so, the bar follows the payload", () => {
  const c = capOf(alert);
  assert.deepEqual([c.level.word, c.level.tone, c.bar], ["Alert: close to the cap", "warn", 84]);
});

test("a plan basis says so; a share over the cap is drawn full", () => {
  const c = capOf({ ...alert, basis: "plan", level: "stop", pct_of_cap: 112 });
  assert.deepEqual([c.cap.note, c.level.word, c.bar], ["out of 1,880 min in your plan", "Stop: the cap is reached", 100]);
});

test("nothing measured: unknown, no bar, the note says why, no rows", () => {
  const c = capOf(none);
  assert.deepEqual([c.level.word, c.bar, c.words], ["Unknown", null, "Nothing to measure yet."]);
  assert.equal(c.note, "Nothing measured yet this month: no routine has written its timing record");
  assert.deepEqual(groupsOf(none), []);
});

test("minutes by kind of work, as sent, largest first", () => {
  assert.deepEqual(groupsOf(ok).map((r) => [r.group, r.minutes, r.runs]), [["Building the tool", "1,528 min", "61"], ["AI books (forecasts)", "214 min", "22"], ["Weekly post-mortem", "54 min", "3"], ["AI roles (desk meeting)", "44 min", "8"]]);
});

test("the screen says no rupees, no copied 80% or half, and no model name", () => {
  for (const name of BUDGET_EXAMPLES) {
    const said = JSON.stringify([capOf(budgetExample(name)), groupsOf(budgetExample(name))]);
    assert.ok(!/₹|\bRs\b|\brupees?\b/i.test(said), `${name}: no money`);
    assert.ok(!/\b80%|\bhalf\b|\b50%/.test(said), `${name}: no BG1 share copied`);
    assert.ok(!/claude|opus|sonnet|haiku|gpt|session_/i.test(said), `${name}: no model or session`);
  }
});
