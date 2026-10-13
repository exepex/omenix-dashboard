// Story W2: the F&O freshness by NSE's calendar and the daily run (07:10 IST, due 08:30 IST; market-publish.yml runs
// every day). Tuesday 13 Oct 2026: today's run publishes Monday 12 Oct; yesterday's published Friday 9 Oct.
import assert from "node:assert/strict";
import { test } from "node:test";
import { nseCalendar } from "../calendar.ts";
import { fnoFreshness } from "../freshness.ts";

const at = (utc: string) => new Date(utc);
const state = (asOf: string, now: string) => fnoFreshness(asOf, "2026-10-13T02:10:00Z", at(now), nseCalendar);

test("before the run starts, the previous session's publication is fresh", () => {
  assert.equal(state("2026-10-09", "2026-10-13T00:30:00Z").state, "fresh"); // 06:00 IST
  const s = state("2026-10-08", "2026-10-13T00:30:00Z");
  assert.equal(s.state, "stale");
  assert.match(s.reason ?? "", /NSE close of 2026-10-09 should have arrived by 08:30 IST and has not; this shows 2026-10-08/);
});

test("during the run window the last complete publication shows as publishing", () => {
  const s = state("2026-10-09", "2026-10-13T02:00:00Z"); // 07:30 IST
  assert.equal(s.state, "publishing");
  assert.match(s.reason ?? "", /NSE close of 2026-10-12 is due by 08:30 IST; until then this shows 2026-10-09/);
  assert.equal(state("2026-10-12", "2026-10-13T02:00:00Z").state, "fresh");
});

test("after the run was due, an older publication is stale with the missing session named", () => {
  const s = state("2026-10-09", "2026-10-13T03:30:00Z"); // 09:00 IST
  assert.equal(s.state, "stale");
  assert.match(s.reason ?? "", /NSE close of 2026-10-12 should have arrived by 08:30 IST and has not; this shows 2026-10-09/);
  assert.equal(state("2026-10-12", "2026-10-13T12:00:00Z").state, "fresh");
});

test("weekends and holidays expect no new session", () => {
  assert.equal(state("2026-10-09", "2026-10-11T02:00:00Z").state, "fresh"); // Sunday 07:30 IST
  assert.equal(state("2026-10-09", "2026-10-12T02:00:00Z").state, "fresh"); // Monday 07:30 IST: Friday is newest
  assert.equal(state("2026-10-19", "2026-10-21T06:00:00Z").state, "fresh"); // the day after Dussehra
});

test("age is from the build time; a day outside the calendar is unknown, never guessed", () => {
  assert.equal(state("2026-10-12", "2026-10-13T03:10:00Z").age_minutes, 60);
  const u = fnoFreshness("2026-12-31", null, at("2027-01-05T06:00:00Z"), nseCalendar);
  assert.equal(u.state, "unknown");
  assert.equal(u.age_minutes, null);
  assert.equal(u.rule, "fno_calendar");
});
