// Story W3b, contract 2.12.0's note (G1's protocol v3: the yardstick is book1_rules, "Rule-based"): the screen never
// implies a question's yardstick is a baseline, nor that every baseline is plain history (judge 249: one reads option
// prices, one is a simple model). A baseline is called "Baseline", its own name says which, and the yardstick is
// whichever forecaster the payload names as primary_baseline, a book included.
import assert from "node:assert/strict";
import { test } from "node:test";
import { labExample } from "../fixture-source.ts";
import { bestOf, forecastersOf } from "../view.ts";
import { questionsOf } from "../question-view.ts";

const lab = labExample("getFnoForecastLab_india_winning");

test("each baseline is just \"Baseline\" beside its own name: never \"Yardstick\", never \"plain history\"", () => {
  const rows = Object.fromEntries(forecastersOf(lab).map((f) => [f.id, f]));
  for (const id of ["baseline_premium_adjusted_implied", "baseline_b_base_rate", "baseline_har"]) assert.equal(rows[id].what, "Baseline", id);
  assert.deepEqual(["baseline_premium_adjusted_implied", "baseline_b_base_rate", "baseline_har"].map((id) => rows[id].name), ["Option prices, premium removed", "How often it happened", "Recent movement"]);
  assert.equal(rows.book1_rules.what, "Book");
  assert.ok(!JSON.stringify(forecastersOf(lab)).includes("plain history"));
});

test("a book named as primary_baseline is the yardstick, by its own name", () => {
  const v3 = { ...lab, questions: lab.questions.map((q) => ({ ...q, primary_baseline: "book1_rules" })) };
  assert.ok(bestOf(v3).every((r) => r.yardstick === "Rule-based"));
  assert.ok(questionsOf(v3).every((c) => c.yardstick === "Rule-based"));
});
