// Story W3b, contract 2.12.0's note (G1's protocol v3: the yardstick is book1_rules, "Rule-based"): the screen never
// implies a question's yardstick is a baseline. A baseline is called "Baseline (plain history)", and the yardstick is
// whichever forecaster the payload names as primary_baseline, a book included.
import assert from "node:assert/strict";
import { test } from "node:test";
import { labExample } from "../fixture-source.ts";
import { bestOf, forecastersOf } from "../view.ts";
import { questionsOf } from "../question-view.ts";

const lab = labExample("getFnoForecastLab_india_winning");

test("a baseline is plain history, never called the yardstick by its kind", () => {
  const what = Object.fromEntries(forecastersOf(lab).map((f) => [f.id, f.what]));
  assert.equal(what.baseline_b_base_rate, "Baseline (plain history)");
  assert.equal(what.book1_rules, "Book");
});

test("a book named as primary_baseline is the yardstick, by its own name", () => {
  const v3 = { ...lab, questions: lab.questions.map((q) => ({ ...q, primary_baseline: "book1_rules" })) };
  assert.ok(bestOf(v3).every((r) => r.yardstick === "Rule-based"));
  assert.ok(questionsOf(v3).every((c) => c.yardstick === "Rule-based"));
});
