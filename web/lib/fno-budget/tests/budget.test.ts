// Story W3g: the AI usage and budget in words, from P1's three examples (good ok, bad alert, empty none). Every figure is
// the payload's: the expected values below are the examples' own numbers, written out by hand. Minutes only; BG1's
// shares come from the payload (contract 2.11.0), never from a copy in the screen's code.
import assert from "node:assert/strict";
import { test } from "node:test";
import { sources, type Source } from "../../shell/tests/imports.ts";
import { budgetExample, BUDGET_EXAMPLES } from "../fixture-source.ts";
import { capOf, groupsOf } from "../view.ts";

const ok = budgetExample("getFnoBudget_india_ok");
const alert = budgetExample("getFnoBudget_india_alert");
const none = budgetExample("getFnoBudget_india_none");

test("within budget: used, the cap out of its basis, the bar at the payload's share", () => {
  const c = capOf(ok);
  assert.deepEqual(c.level, { tone: "success", icon: "check", word: "Within budget" });
  assert.deepEqual([c.used.v, c.used.note, c.cap.v, c.cap.note], ["312 min", "in November 2026", "920 min", "50% of 1,840 min measured"]);
  assert.deepEqual([c.bar, c.tick, c.aria], [33.9, 80, "34% of the cap used; the alert is at 80%"]);
  assert.equal(c.words, "34% of the cap used. At 80% an alert goes out; at 100% the AI roles stop, the AI forecasters last.");
  assert.equal(c.howTo, "The budget is counted in minutes of AI sessions, not money. The AI books and roles may use at most 50% of the basis.");
  assert.equal(c.note, null);
});

test("past the alert: the level says so, the bar follows the payload", () => {
  const c = capOf(alert);
  assert.deepEqual([c.level.word, c.level.tone, c.bar], ["Alert: close to the cap", "warn", 84]);
});

test("a plan basis says so; a share over the cap is drawn full", () => {
  const c = capOf({ ...alert, basis: "plan", level: "stop", pct_of_cap: 112 });
  assert.deepEqual([c.cap.note, c.level.word, c.bar], ["50% of 1,880 min in your plan", "Stop: the cap is reached", 100]);
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

test("the shares are the payload's own: different shares change the mark and the words", () => {
  const c = capOf({ ...ok, share_pct: 40, alert_pct: 70, stop_pct: 90 });
  assert.deepEqual([c.cap.note, c.tick, c.aria], ["40% of 1,840 min measured", 70, "34% of the cap used; the alert is at 70%"]);
  assert.equal(c.words, "34% of the cap used. At 70% an alert goes out; at 90% the AI roles stop, the AI forecasters last.");
  assert.equal(capOf({ ...ok, alert_pct: 120 }).tick, 100, "a mark past the cap is drawn at its end");
});

const SCREEN = ["lib/fno-budget", "components/fno-budget", "app/(cockpit)/[market]/budget"];
const screenCode = (): Source[] => SCREEN.flatMap(sources).filter((f) => !/(^|\/)tests\//.test(f.path));
/** Every copy of BG1's shares in the screen's code: a literal 50, 80 or 100 percent, or "half". */
const copiedShares = (files: Source[]) => files.flatMap((f) => [...f.text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").matchAll(/\b(?:50|80|100)\s*%|\bhalf\b/gi)].map((m) => `${f.path}: ${m[0]}`));

test("the screen's code holds no copy of BG1's shares, and says no rupees and no model name", () => {
  assert.ok(screenCode().length >= 7, "the scan covers the screen's files");
  assert.deepEqual(copiedShares(screenCode()), []);
  assert.deepEqual(copiedShares([{ path: "plant.ts", text: 'const w = "At 80% an alert goes out";' }]), ["plant.ts: 80%"], "a planted copy is caught");
  for (const name of BUDGET_EXAMPLES) {
    const said = JSON.stringify([capOf(budgetExample(name)), groupsOf(budgetExample(name))]);
    assert.ok(!/₹|\bRs\b|\brupees?\b/i.test(said), `${name}: no money`);
    assert.ok(!/claude|opus|sonnet|haiku|gpt|session_/i.test(said), `${name}: no model or session`);
  }
});
