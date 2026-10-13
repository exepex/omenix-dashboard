// Story W9-F&O: Home reads India's session, the F&O books and the F&O expiry dates from the F&O publication and every
// stock block from the stock adapter (the labelled examples); "Coming up" merges the two lists without showing an
// expiry twice, each row keeping where it came from.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { FnoBlockReader, FnoPageKey } from "../../fno/blocks.ts";
import { fnoHomeData } from "../azure-source.ts";
import type { CalendarEvent } from "../contract.ts";
import { comingUp, fnoExpiries } from "../events.ts";
import { fixtureHomeData } from "../fixture-source.ts";

const freshness = { state: "fresh" as const, rule: "fno_calendar" as const, built_at: null, age_minutes: null, reason: null };
const pages: Partial<Record<FnoPageKey, unknown>> = {
  session: { session_date: "2026-10-13", from: "fno" },
  risk: { currency: "INR", books: [{ book: 1, from: "fno" }] },
  events: { events: [{ date: "2026-10-27", title: "NIFTY monthly expiry", kind: "fno_expiry", major: true, inst: null }] },
};
const reads: FnoPageKey[] = [];
const reader: FnoBlockReader = {
  page: async <T>(key: FnoPageKey) => {
    reads.push(key);
    return { payload: pages[key] as T, publication_id: "p", as_of: "2026-10-12", freshness };
  },
  status: async () => ({ publication_id: "p", as_of: "2026-10-12", freshness }),
};

test("India's session, the F&O books and expiry dates come from the F&O publication; the stock blocks stay example", async () => {
  const home = fnoHomeData(reader, fixtureHomeData);
  assert.deepEqual(await home.session("india"), pages.session);
  assert.deepEqual(await home.fnoBooks(), pages.risk);
  assert.deepEqual(await home.fnoEvents(), pages.events);
  assert.deepEqual(await home.session("us"), await fixtureHomeData.session("us"), "the US session is the stock adapter's");
  for (const stock of ["trackedMoves", "accounts", "positions", "groups", "strategyTrades", "attention", "events", "topNews"] as const) {
    assert.equal(home[stock], fixtureHomeData[stock], `${stock} is the stock adapter's own method`);
  }
  assert.deepEqual(reads.sort(), ["events", "risk", "session"], "the US read never touches the F&O publication");
});

const ev = (date: string, kind: string, title = kind): CalendarEvent => ({ date, title, kind, major: false, inst: null });

test("Coming up: the F&O expiry rows replace the stock list's own, the rest merge by date with their source", () => {
  const stock = { events: [ev("2026-10-16", "earnings"), ev("2026-10-27", "fno_expiry", "example expiry"), ev("2026-10-20", "holiday")] };
  const fno = { events: [ev("2026-10-27", "fno_expiry", "NIFTY monthly expiry")] };
  const rows = comingUp(stock, false, fno, true);
  assert.deepEqual(rows.map((r) => [r.event.date, r.event.title, r.live]), [
    ["2026-10-16", "earnings", false],
    ["2026-10-20", "holiday", false],
    ["2026-10-27", "NIFTY monthly expiry", true],
  ]);
  assert.deepEqual(comingUp(stock, false, null, false).map((r) => r.event.title), ["earnings", "holiday", "example expiry"], "without an F&O list (the US) the stock list is whole");
  assert.deepEqual(comingUp(stock, false, { events: [] }, true).map((r) => r.event.kind), ["earnings", "holiday"], "an empty F&O list still owns the expiries: no example expiry is shown");
});

test("the fixtures split the same way, so the example page shows what it showed before", async () => {
  const india = await fixtureHomeData.events("india");
  const fno = await fixtureHomeData.fnoEvents();
  assert.ok(fno.events.length > 0 && fno.events.every((e) => e.kind === "fno_expiry"));
  assert.deepEqual(fnoExpiries(india), fno);
  assert.deepEqual(comingUp(india, false, fno, false).map((r) => r.event), india.events, "the same rows in the same order");
});
