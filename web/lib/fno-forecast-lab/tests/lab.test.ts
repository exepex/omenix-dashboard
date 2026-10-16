// Story W3b: the Forecast lab in words, from P1's three examples (winning, losing, waiting). Every figure and verdict
// is the payload's: the expected values below are the examples' own, written out by hand.
import assert from "node:assert/strict";
import { test } from "node:test";
import { navGroups } from "../../shell/nav.ts";
import { pageByKey, pagePath } from "../../ui/routes.ts";
import { labExample } from "../fixture-source.ts";
import { questionOf, ranked, settleWords } from "../question-view.ts";
import { answerOf, bestOf, forecastersOf, protocolsOf, todayOf } from "../view.ts";

const winning = labExample("getFnoForecastLab_india_winning");
const losing = labExample("getFnoForecastLab_india_losing");
const waiting = labExample("getFnoForecastLab_india_waiting");

test("today's answers name each forecaster, say when the answer is known, and never count a late or breached answer", () => {
  const [q1] = todayOf(winning);
  assert.equal(q1.knownOn, "14 Jul 2027", "Q1 is a 20-session question made on 16 Jun 2027");
  assert.match(q1.answers, /^Rule-based 52% · Hybrid 61% · AI team 58% · /);
  const q4 = todayOf(losing)[0];
  assert.match(q4.answers, /AI team 91% \(late, not counted\) · Hybrid 52% \(audit breach, not counted\)/);
  const v2 = losing.questions.find((q) => q.id === "V2")!;
  assert.equal(answerOf(v2, v2.today!.values[0]), "0.0251");
  assert.equal(todayOf(waiting).length, 1, "a waiting or not-started question made no forecast today");
});

test("who beats the yardstick comes from the backend's verdicts only, question by question", () => {
  const [q1, v6] = bestOf(winning);
  assert.deepEqual([q1.best.word, q1.worse], ["Better: Hybrid", null]);
  assert.equal(v6.best.word, "Better: Weather");
  assert.deepEqual(bestOf(losing)[0].worse, "Worse: AI team");
  assert.equal(bestOf(losing)[0].best.word, "Nobody better yet");
  assert.equal(bestOf(waiting).find((r) => r.question.includes("V1") || r.best.word === "Not tested yet")?.best.word, "Not tested yet");
});

test("a question ranks its forecasters by average miss within itself (unscored last, no rank); verdicts and settle in words", () => {
  const card = questionOf(winning, winning.questions[0]);
  assert.equal(card.state.word, "Scoring");
  assert.equal(card.missHead, "Average miss (Brier, lower is better)");
  assert.deepEqual(card.rows.map((r) => r.rank), card.rows.map((r, i) => (r.miss === "—" ? "—" : String(i + 1))));
  assert.equal(card.verdicts[0].look.word, "Better than the yardstick");
  assert.equal(card.settle, "Too few days to say when it could settle (under 60).");
  assert.deepEqual(ranked([{ forecaster: "a", n: 0, n_missing: 0, mean_loss: null }, { forecaster: "b", n: 9, n_missing: 0, mean_loss: 0.2 }, { forecaster: "c", n: 9, n_missing: 0, mean_loss: 0.1 }]).map((r) => r.forecaster), ["c", "b", "a"]);
  const futile = questionOf(losing, losing.questions.find((q) => q.id === "V2")!);
  assert.equal(futile.verdicts[0].look.word, "Cannot win: stop testing");
  assert.equal(futile.settle, "Would need until 1 Mar 2033: too long to wait.");
  assert.ok(futile.provisional, "v4 numbers are marked as not frozen");
  assert.equal(settleWords({ status: "projected", r: 3.1, projected_date: "2027-05-20" }), "Could settle around 20 May 2027.");
});

test("a waiting question names what it waits for; a not-started one has no settle line", () => {
  const v1 = questionOf(waiting, waiting.questions.find((q) => q.id === "V1")!);
  assert.equal(v1.state.word, "Waiting for data");
  assert.ok(v1.waiting.length >= 1 && v1.settle === null);
  assert.equal(questionOf(waiting, waiting.questions.find((q) => q.id === "V6_1d")!).state.word, "Not started");
});

test("who forecasts: an AI book always shows its isolation label as sent; coverage counts missing and late days", () => {
  const rows = forecastersOf(winning);
  const hybrid = rows.find((r) => r.id === "book2_hybrid")!;
  assert.deepEqual([hybrid.keptBy, hybrid.counted, hybrid.detail], ["sealed same day (not full F1)", "151 of 160", "3 missing · 4 late · 2 not scored"]);
  assert.equal(rows.find((r) => r.id === "book1_rules")!.keptBy, "Plain code");
  assert.equal(forecastersOf(waiting)[0].counted, "—", "no common start yet: no coverage, never zero");
  assert.deepEqual(protocolsOf(waiting).map((p) => p.label), ["Protocol v3: frozen", "Protocol v4: draft (nothing counts yet)"]);
});

test("the Forecast lab is India's Strategies item at /india/forecast-lab and absent in the US", () => {
  const items = (fno: boolean) => navGroups(fno).flatMap((g) => (g ? g.items.map((i) => [g.id, i.id, i.page] as const) : []));
  assert.ok(items(true).some(([g, i, p]) => g === "strategies" && i === "forecasts" && p === "forecasts"));
  assert.ok(!items(false).some(([, i]) => i === "forecasts"));
  assert.deepEqual([pagePath("india", "forecasts"), pageByKey("forecasts").mockup, pageByKey("forecasts").endpoint], ["/india/forecast-lab", "37-forecasts", "fno/forecast-lab"]);
});
