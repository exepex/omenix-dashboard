// Stories W9-F&O and contract 2.5: Home reads India's session, the F&O books and the NSE F&O expiry calendar from
// exepex/trading's publication and every stock block from the stock adapter (the labelled examples). A screen's
// "Coming up" merges the two calendars and applies its own query again: the TypeScript query is held equal to the
// contract's (each x-query example from its calendar), and the merged lists are the signed-off ones.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import type { FnoBlockReader, FnoPageKey } from "../../fno/blocks.ts";
import { fnoHomeData } from "../azure-source.ts";
import type { CalendarEvent, Events } from "../contract.ts";
import { comingUp, eventsView, HOME_EVENTS, MARKETS_EVENTS, type EventsQuery } from "../events.ts";
import { fixtureHomeData } from "../fixture-source.ts";

const repo = join(import.meta.dirname, "..", "..", "..", "..");
type Example = { "x-query"?: EventsQuery & { from: string }; value: { payload: Events } };
const load = (file: string) => JSON.parse(readFileSync(join(repo, "api/examples", file), "utf8")) as Record<string, Example>;
const examples = { ...load("blocks.json"), ...load("blocks-33-34.json") };
const freshness = { state: "fresh" as const, rule: "fno_calendar" as const, built_at: null, age_minutes: null, reason: null };
const pages: Partial<Record<FnoPageKey, unknown>> = {
  session: { session_date: "2026-10-13", from: "fno" },
  risk: { currency: "INR", books: [{ book: 1, from: "fno" }] },
  fno_events: { events: [{ date: "2026-10-27", title: "NIFTY monthly expiry", kind: "fno_expiry", major: true, inst: null }] },
};
const reads: FnoPageKey[] = [];
const reader: FnoBlockReader = {
  page: async <T>(key: FnoPageKey) => {
    reads.push(key);
    return { payload: pages[key] as T, publication_id: "p", as_of: "2026-10-12", freshness };
  },
  status: async () => ({ publication_id: "p", as_of: "2026-10-12", freshness }),
};

test("India's session, the F&O books and expiry calendar come from exepex/trading; the stock blocks stay example", async () => {
  const home = fnoHomeData(reader, fixtureHomeData);
  assert.deepEqual(await home.session("india"), pages.session);
  assert.deepEqual(await home.fnoBooks(), pages.risk);
  assert.deepEqual(await home.fnoEvents(), pages.fno_events);
  assert.deepEqual(await home.session("us"), await fixtureHomeData.session("us"), "the US session is the stock adapter's");
  for (const stock of ["trackedMoves", "accounts", "positions", "groups", "strategyTrades", "attention", "events", "topNews"] as const) {
    assert.equal(home[stock], fixtureHomeData[stock], `${stock} is the stock adapter's own method`);
  }
  assert.deepEqual(reads.sort(), ["fno_events", "risk", "session"], "the US read never touches the F&O publication");
});

const rows = (events: CalendarEvent[]) => events.map((event) => ({ event, live: false }));

test("the query is the contract's: every x-query example is its publisher's calendar under that query", () => {
  const views = Object.entries(examples).filter(([name, e]) => /^get(Fno)?Events_/.test(name) && e["x-query"] && !name.endsWith("_calendar"));
  assert.ok(views.length >= 8);
  for (const [name, e] of views) {
    const calendar = examples[`${name.split("_")[0]}_${name.split("_")[1]}_calendar`].value.payload.events;
    const q = e["x-query"]!;
    const mine = eventsView(rows(calendar), q, q.from).map((r) => r.event);
    assert.deepEqual(mine, e.value.payload.events, name);
  }
});

test("Home's merged list is the signed-off Coming up of 31; India's stock calendar has no expiry", () => {
  const signed = JSON.parse(readFileSync(join(repo, "design/mockups/31-dashboard/data.json"), "utf8")).markets.india.events;
  const stock = examples.getEvents_india.value.payload;
  assert.ok(stock.events.every((e) => e.kind !== "fno_expiry" && e.kind !== "weekly_expiry"));
  const merged = comingUp(stock, false, examples.getFnoEvents_india.value.payload, true, HOME_EVENTS, examples.getEvents_india["x-query"]!.from);
  assert.deepEqual(merged.map((r) => r.event), signed);
  assert.deepEqual(merged.filter((r) => r.live).map((r) => r.event.kind), ["fno_expiry"], "only the expiry row is the F&O tool's");
});

test("the Markets overview's merged list is the one calendar's view (limit 12)", () => {
  const q = examples.getEvents_india_markets["x-query"]!;
  const merged = comingUp(examples.getEvents_india_markets.value.payload, false, examples.getFnoEvents_india_markets.value.payload, true, MARKETS_EVENTS, q.from);
  const calendar = [...examples.getEvents_india_calendar.value.payload.events, ...examples.getFnoEvents_india_calendar.value.payload.events];
  assert.deepEqual(merged.map((r) => r.event), eventsView(rows(calendar), MARKETS_EVENTS, q.from).map((r) => r.event));
  assert.equal(merged.length, 12);
  assert.ok(merged.some((r) => r.event.kind === "weekly_expiry"));
});

test("the US list is the stock calendar alone, under the screen's query", () => {
  const us = examples.getEvents_us.value.payload;
  assert.deepEqual(comingUp(us, false, null, false, HOME_EVENTS, examples.getEvents_us["x-query"]!.from).map((r) => r.event), us.events);
});
