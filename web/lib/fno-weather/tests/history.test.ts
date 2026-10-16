// Story W3a part 2: the weather's history in words, from P1's three examples (good calm, bad stormy, empty none). Every
// figure is the payload's: the expected values below are the examples' own numbers, written out by hand.
import assert from "node:assert/strict";
import { test } from "node:test";
import { historyExample } from "../fixture-source.ts";
import { countsOf, monthsOf, NO_HISTORY } from "../history-view.ts";

const calm = historyExample("getFnoWeatherHistory_india_calm");
const stormy = historyExample("getFnoWeatherHistory_india_stormy");
const none = historyExample("getFnoWeatherHistory_india_none");

test("the counts: each colour as a number and a share of all sessions; not scored says it blocks like RED", () => {
  const c = countsOf(stormy);
  assert.ok(c.kind === "counted");
  assert.deepEqual(c.facts, [
    { label: "GREEN (calm)", value: "25", note: "83%" },
    { label: "AMBER (take care)", value: "1", note: "3%" },
    { label: "RED (no new trades)", value: "3", note: "10%" },
    { label: "Not scored", value: "1", note: "An input was missing; blocks like RED" },
  ]);
  assert.equal(c.aria, "25 GREEN, 1 AMBER, 3 RED, 1 not scored");
  assert.deepEqual(c.mix.map((m) => [m.tone, m.width]), [["g", 83.33], ["a", 3.33], ["r", 10], ["n", 3.33]]);
  assert.deepEqual([c.live, c.rebuilt], ["10 made live", "20 rebuilt from history (exploratory)"]);
});

test("a colour with no session gets no bar part, but still its fact (0, 0%)", () => {
  const c = countsOf(calm);
  assert.ok(c.kind === "counted");
  assert.deepEqual(c.mix.map((m) => m.tone), ["g", "a"]);
  assert.deepEqual(c.facts[2], { label: "RED (no new trades)", value: "0", note: "0%" });
});

test("no record yet: the counts say so and there is no session strip", () => {
  assert.deepEqual(countsOf(none), { kind: "none", text: NO_HISTORY });
  assert.deepEqual(monthsOf(none), []);
});

test("session by session: one strip per month, oldest first, each tile with its colour label and live or rebuilt", () => {
  const months = monthsOf(stormy);
  assert.deepEqual(months.map((m) => [m.month, m.tiles.length]), [["October 2026", 19], ["November 2026", 11]]);
  assert.deepEqual(months[0].tiles[0], { day: "6 Oct", label: { tone: "success", icon: "check", word: "GREEN" }, mark: "rebuilt" });
  const nov = months[1].tiles;
  assert.deepEqual([nov[0].mark, nov[1].mark], ["rebuilt", "live"], "2 Nov rebuilt, 3 Nov the first live session");
  assert.deepEqual(nov.find((t) => t.day === "10 Nov")?.label, { tone: "neutral", icon: "remove", word: "No colour" });
  assert.deepEqual(nov.filter((t) => t.label.word === "RED").map((t) => t.day), ["5 Nov", "6 Nov", "11 Nov"]);
});

test("the order is the sessions' own dates, whatever order the payload sends them in", () => {
  const shuffled = { ...stormy, sessions: [...stormy.sessions].reverse() };
  assert.deepEqual(monthsOf(shuffled), monthsOf(stormy));
});
