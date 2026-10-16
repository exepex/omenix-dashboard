// Story W3e: the F&O data health in words, from P1's three examples (good ok, bad problems, empty none). Every figure is
// the payload's: the expected values below are the examples' own numbers, written out by hand. Dates, counts and
// statuses only: no data value can reach the screen.
import assert from "node:assert/strict";
import { test } from "node:test";
import { healthExample } from "../fixture-source.ts";
import { checkOf, publishOf, sourcesOf } from "../view.ts";

const ok = healthExample("getFnoDataHealth_india_ok");
const problems = healthExample("getFnoDataHealth_india_problems");
const none = healthExample("getFnoDataHealth_india_none");

test("all well: published for the session, the check found everything, each source up to date", () => {
  assert.deepEqual(publishOf(ok), { look: { tone: "success", icon: "check", word: "Published" }, when: "For the session of 16 Nov 2026", reason: null });
  assert.deepEqual(checkOf(ok), { look: { tone: "success", icon: "check", word: "All expected files and runs found" }, when: "16 Nov 2026 · 0 problems", reason: null });
  assert.deepEqual(sourcesOf(ok)[0], { id: "index-close", plain: "NIFTY daily close (NSE)", look: { tone: "success", icon: "check", word: "Up to date" }, lastDay: "16 Nov 2026", rows: "2,449", gaps: "0" });
  assert.equal(sourcesOf(ok)[3].rows, "4,210");
});

test("problems: a failed publish keeps yesterday's pages and says why; sources behind or missing days, in the payload's order", () => {
  const p = publishOf(problems);
  assert.equal(p.look.word, "Failed: yesterday’s pages stay");
  assert.equal(p.reason, "the F&O end-of-day file for the session was not on NSE's site by 08:30 IST");
  assert.equal(checkOf(problems).when, "16 Nov 2026 · 3 problems");
  assert.deepEqual(sourcesOf(problems).map((s) => [s.id, s.look.word, s.lastDay, s.gaps]), [
    ["fo-bhavcopy", "Days missing", "12 Nov 2026", "2"],
    ["participant-oi", "Behind", "13 Nov 2026", "0"],
    ["index-close", "Up to date", "16 Nov 2026", "0"],
  ]);
});

test("one problem is singular", () => {
  assert.equal(checkOf({ ...problems, health_check: { status: "problems", run_on: "2026-11-16", problems: 1 } }).when, "16 Nov 2026 · 1 problem");
});

test("nothing run yet: no publish, no check, no source", () => {
  assert.deepEqual([publishOf(none).look.word, publishOf(none).when, checkOf(none).when, sourcesOf(none)], ["Not run yet", "No publish yet.", "No check yet.", []]);
});

test("a source with no file says so, with no last day", () => {
  const missing = { ...none, sources: [{ source: "vix", plain: "India VIX daily (NSE)", last_day: null, rows: 0, gaps: 0, status: "missing" as const }] };
  assert.deepEqual(sourcesOf(missing)[0].look, { tone: "danger", icon: "block", word: "No file" });
  assert.equal(sourcesOf(missing)[0].lastDay, "—");
});
