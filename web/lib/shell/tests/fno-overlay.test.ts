// Story W9-F&O: the frame's F&O-owned parts (India's index levels, session and F&O picks) come from the F&O
// publication; everything else stays the labelled example; the US slice is never touched; a part with no data carries
// its reason, never an example value.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import type { FnoBlockReader, FnoPageKey } from "../../fno/blocks.ts";
import { nseCalendar } from "../../fno/calendar.ts";
import { FnoUnavailable } from "../../fno/db.ts";
import { calendarSession } from "../../fno/session-fallback.ts";
import { BlockEmpty } from "../../ui/block-states.ts";
import { fnoShellData } from "../azure-source.ts";
import { fixtureShellData } from "../fixture-source.ts";
import { frameData } from "../view.ts";

const repo = join(import.meta.dirname, "..", "..", "..", "..");
const w10 = JSON.parse(readFileSync(join(repo, "api/examples/blocks.json"), "utf8"));
const page = (op: string) => structuredClone(w10[op].value.payload);
const NOW = new Date("2026-10-13T05:00:00Z"); // Tuesday 10:30 IST

/** P10-shaped pages; `fail` names a page key and what reading it throws. */
function reader(pages: Partial<Record<FnoPageKey, unknown>>, fail: Partial<Record<FnoPageKey, Error>> = {}): FnoBlockReader {
  return {
    page: async <T>(key: FnoPageKey) => {
      if (fail[key]) throw fail[key];
      return { payload: pages[key] as T, publication_id: "p", as_of: "2026-10-12", freshness: { state: "fresh", rule: "fno_calendar", built_at: null, age_minutes: null, reason: null } };
    },
    status: async () => ({ publication_id: "p", as_of: "2026-10-12", freshness: { state: "fresh", rule: "fno_calendar", built_at: null, age_minutes: null, reason: null } }),
  };
}

const live = { session: { ...page("getSession_india"), session_date: "2026-10-13", open_utc: "2026-10-13T03:45:00Z", close_utc: "2026-10-13T10:00:00Z", next_open_utc: "2026-10-14T03:45:00Z" }, indices: page("getIndices_india"), today: page("getFnoPicks_india") };
live.indices.indices[0].last = 25123.45; // differs from the example, so the test sees which one is shown

test("India's index levels, session and F&O picks are the publication's; the stock parts stay example", async () => {
  const base = await fixtureShellData.read();
  const got = await fnoShellData(reader(live), fixtureShellData, nseCalendar, () => NOW).read();
  const india = got.markets.india;
  assert.equal(got.now, NOW.toISOString(), "the frame's clock is the read time");
  assert.equal(got.example, true, "the stock parts are still example records");
  assert.deepEqual(india.indices, ["NIFTY50", "INDIAVIX"]);
  assert.equal(india.items.NIFTY50.last, 25123.45);
  assert.equal(india.items.NIFTY50.live, true);
  assert.equal(india.items.INDIAVIX.live, true);
  assert.deepEqual(india.status, { session_date: "2026-10-13", open_utc: "2026-10-13T03:45:00Z", close_utc: "2026-10-13T10:00:00Z", next_open_utc: "2026-10-14T03:45:00Z" });
  assert.deepEqual(india.fno_state, live.today.fno_state);
  assert.deepEqual(india.fno_rows, []);
  assert.deepEqual(india.fno_live, { missing: { session: undefined, indices: undefined, picks: undefined } });
  assert.deepEqual(india.items.RELIANCE, base.markets.india.items.RELIANCE, "a stock item is untouched");
  assert.deepEqual(india.signals, base.markets.india.signals, "the stock picks are untouched");
  assert.deepEqual(got.markets.us, base.markets.us, "the US slice is never touched");
});

test("the US frame has no F&O element, whatever India reads", async () => {
  const us = frameData(await fnoShellData(reader(live), fixtureShellData, nseCalendar, () => NOW).read(), "us").shell;
  assert.equal(us.fno_live, undefined);
  assert.equal(us.fno_rows, undefined);
  assert.equal(us.fno_state, undefined);
});

test("a part with no data carries its reason, never the example value", async () => {
  const empty = new BlockEmpty("page_missing", "2026-10-13T05:00:00.000Z");
  const got = await fnoShellData(reader(live, { indices: empty, today: new FnoUnavailable("network") }), fixtureShellData, nseCalendar, () => NOW).read();
  const india = got.markets.india;
  assert.deepEqual(india.indices, [], "no example index level is shown");
  assert.equal(india.items.NIFTY50, undefined);
  assert.match(india.fno_live?.missing.indices ?? "", /The current publication has no page for this part\. Checked 2026-10-13 05:00 UTC\./);
  assert.equal(india.fno_state, undefined, "no example F&O note is shown");
  assert.equal(india.fno_live?.missing.picks, "This part could not be read; the rest of the page works.");
});

test("without a published session the market hours are NSE's calendar at regular hours, said as such", async () => {
  const got = await fnoShellData(reader(live, { session: new BlockEmpty("not_published", "2026-10-13T05:00:00.000Z") }), fixtureShellData, nseCalendar, () => NOW).read();
  assert.deepEqual(got.markets.india.status, calendarSession(NOW, nseCalendar));
  assert.match(got.markets.india.fno_live?.missing.session ?? "", /Nothing has been published.*NSE’s calendar at regular hours/);
});

test("the calendar's session: today on a session day, the last one on a closed day, the next open after today", () => {
  assert.deepEqual(calendarSession(NOW, nseCalendar), { session_date: "2026-10-13", open_utc: "2026-10-13T03:45:00Z", close_utc: "2026-10-13T10:00:00Z", next_open_utc: "2026-10-14T03:45:00Z" });
  const saturday = calendarSession(new Date("2026-10-10T06:00:00Z"), nseCalendar);
  assert.equal(saturday.session_date, "2026-10-09");
  assert.equal(saturday.next_open_utc, "2026-10-12T03:45:00Z");
  const dussehra = calendarSession(new Date("2026-10-20T06:00:00Z"), nseCalendar);
  assert.equal(dussehra.session_date, "2026-10-19");
  assert.equal(dussehra.next_open_utc, "2026-10-21T03:45:00Z");
  assert.equal(calendarSession(new Date("2026-10-13T20:00:00Z"), nseCalendar).session_date, "2026-10-14", "after midnight IST it is the next day");
});
