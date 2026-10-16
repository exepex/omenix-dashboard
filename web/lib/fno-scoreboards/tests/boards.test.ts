// Story W3h: the F&O scoreboards in words, from P1's three examples (good ahead, bad behind with a pilot, empty none).
// Every figure is the payload's: the expected values below are the examples' own numbers, written out by hand. The two
// boards stay apart and no row is ever a total across books.
import assert from "node:assert/strict";
import { test } from "node:test";
import { boardsExample } from "../fixture-source.ts";
import { boardsOf } from "../view.ts";

const ahead = boardsExample("getFnoScoreboards_india_ahead");
const behind = boardsExample("getFnoScoreboards_india_behind");
const none = boardsExample("getFnoScoreboards_india_none");

test("B first, then A, each its own card with its question", () => {
  assert.deepEqual(boardsOf(ahead).map((b) => b.title), ["Scoreboard B: whole systems", "Scoreboard A: matched decisions"]);
});

test("a board that ran: its standing, one row per book after all costs, the do-nothing yardstick", () => {
  const [b] = boardsOf(ahead);
  assert.deepEqual([b.status.word, b.ran, b.standing], ["Ran", true, "Whole systems since the common start (1 Oct 2026) · as of 16 Nov 2026"]);
  assert.deepEqual(b.rows.map((r) => [r.family, r.trades, r.net.word, r.worstMonth, r.largestFall, r.beats?.word]), [
    ["rule", "14", "Up +₹26,120", "−₹6,200", "₹9,400", "Not enough trades yet"],
    ["hybrid", "11", "Up +₹9,840", "−₹11,300", "₹14,100", "Not enough trades yet"],
    ["ai", "9", "Down −₹4,230", "−₹8,800", "₹12,600", "Not enough trades yet"],
  ]);
  assert.equal(b.doNothing?.word, "Up +₹18,400");
  assert.ok(!JSON.stringify(boardsOf(ahead)).includes("31,730"), "no total of the three books' nets");
});

test("behind: every book says No against doing nothing; a pilot board gives no verdict and no yardstick", () => {
  const [b, a] = boardsOf(behind);
  assert.deepEqual(b.rows.map((r) => [r.beats?.word, r.beats?.tone]), [["No", "danger"], ["No", "danger"], ["No", "danger"]]);
  assert.deepEqual([a.status.word, a.ran, a.doNothing], ["Pilot: no verdict", true, null]);
  assert.deepEqual(a.rows.map((r) => [r.beats, r.worstMonth]), [[null, "—"], [null, "—"], [null, "—"]]);
});

test("nothing run: both boards say so and carry no rows", () => {
  for (const b of boardsOf(none)) assert.deepEqual([b.status.word, b.ran, b.rows, b.doNothing], ["Not run yet", false, [], null]);
});

test("a book that beat doing nothing says Yes", () => {
  const yes = { ...ahead, board_b: { ...ahead.board_b, books: [{ ...ahead.board_b.books[0], beats_do_nothing: "yes" as const }] } };
  assert.deepEqual(boardsOf(yes)[0].rows[0].beats, { tone: "success", icon: "check", word: "Yes" });
});
