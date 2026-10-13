// Story W2's acceptance on a real PostgreSQL with TLS (a disposable one: throwaway-pg.ts). The read path is the one the
// app runs (fnoQuery, AzureFnoRowStore, PublicationReader, the Screener's and Markets' database adapters); only the
// trusted root differs: the test's CA here, Azure's pinned roots in the app (lib/fno/config.ts).
//   1. During a publication the previous complete one shows, "publishing"; after a failed run, "stale" with the reason.
//   2. A payload of another major version is the incompatible state, never a broken page.
//   3. Database errors never carry the driver's text or credentials to the page.
// Run in India's time zone: dates must not move a day (the driver reads a date as local midnight).
process.env.TZ = "Asia/Kolkata";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { fnoHomeData } from "../../home/azure-source.ts";
import { fixtureHomeData } from "../../home/fixture-source.ts";
import { azureOverviewData } from "../../overview/azure-source.ts";
import { fnoShellData } from "../../shell/azure-source.ts";
import { fixtureShellData } from "../../shell/fixture-source.ts";
import { azureScreenerData } from "../../screener/azure-source.ts";
import type { ScreenerStock } from "../../screener/contract.ts";
import { outcomeOf } from "../../ui/block-outcome.ts";
import { BlockEmpty, BlockIncompatible } from "../../ui/block-states.ts";
import { AZURE_POSTGRES_ROOTS } from "../azure-roots.ts";
import { PublicationReader, type FnoPageKey } from "../blocks.ts";
import { nseCalendar } from "../calendar.ts";
import { FnoUnavailable, fnoQuery } from "../db.ts";
import { AzureFnoRowStore } from "../store.ts";
import { PASSWORD, ROLE, pgBin, startThrowawayPg, type ThrowawayPg } from "./throwaway-pg.ts";

const bin = pgBin();
// Skipped only on a machine without PostgreSQL; in CI (GitHub's Ubuntu image has it) a missing install fails instead.
const skip = bin || process.env.CI ? false : "no PostgreSQL binaries installed";
const repo = join(import.meta.dirname, "..", "..", "..", "..");
const examples = JSON.parse(readFileSync(join(repo, "api/examples/blocks-33-34.json"), "utf8"));
const homeExamples = JSON.parse(readFileSync(join(repo, "api/examples/blocks.json"), "utf8"));
const home = (op: string) => homeExamples[op].value.payload;
const day = JSON.parse(readFileSync(join(repo, "design/mockups/33-screener/data.json"), "utf8")).markets.india;
const ex = (op: string) => examples[op].value.payload;
const table = (rows: object[]) => ({ as_of: "2026-10-12", currency: "INR", total: rows.length, rows });
const PAGES: Record<FnoPageKey, unknown> = {
  screener_summary: ex("getScreenerSummaryIndia_india"),
  screener_stocks: table(day.stocks.map(({ k: _k, ...r }: { k?: unknown }) => r).sort((a: ScreenerStock, b: ScreenerStock) => b.p * b.v - a.p * a.v)),
  fno_screener_summary: ex("getFnoScreenerSummary_india"),
  fno_screener_rows: table(day.fno),
  overview_indices: ex("getOverviewIndicesIndia_india"),
  overview_sectors: ex("getIndiaSectors_india"),
  // exepex/trading's pages for Home, the frame and Markets, shaped as contract 2.5's examples
  flows: ex("getFlows_india"),
  session: home("getSessionIndia_india"),
  indices: home("getIndicesIndia_india"),
  today: home("getFnoPicks_india"),
  risk: home("getFnoBooks_india"),
  fno_events: ex("getFnoEvents_india_calendar"),
};
const KEYS = Object.keys(PAGES) as FnoPageKey[];
const IST = (date: string, time: string) => new Date(`${date}T${time}:00+05:30`);

let db: ThrowawayPg;
const settings = (over: object = {}) => ({ host: "localhost", port: db.port, database: "postgres", user: ROLE, password: PASSWORD, ca: db.ca, ...over });
const reader = (now: Date, over: object = {}) => new PublicationReader(new AzureFnoRowStore(fnoQuery(settings(over))), nseCalendar, () => now);

async function publish(id: string, asOf: string, keys: FnoPageKey[], { version = "2.4.0", movePointer = true } = {}) {
  for (const key of keys) {
    const payload = JSON.stringify(PAGES[key]);
    await db.admin.query(
      "insert into fno.pages_history values ('fno', $1, $2, 'india', $3, $4, $4, $5, 'abc1234', $6, $7)",
      [key, id, asOf, `${asOf}T12:30:00Z`, version, createHash("sha256").update(payload).digest("hex"), payload],
    );
  }
  if (movePointer) {
    await db.admin.query(
      "insert into fno.current_publication values ('fno', $1, $2, $3) on conflict (product) do update set publication_id = $1, as_of = $2, published_at = $3",
      [id, asOf, `${asOf}T13:00:00Z`],
    );
  }
}
const reset = () => db.admin.query("truncate fno.pages_history, fno.current_publication");

before(async () => {
  if (!bin && process.env.CI) throw new Error("CI must run the W2 integration tests: no PostgreSQL binaries under /usr/lib/postgresql");
  if (bin) db = await startThrowawayPg(bin);
});
after(async () => {
  if (bin) await db.stop();
});

test("1. a run in progress shows the last complete publication as publishing; a failed run, stale with its reason", { skip }, async () => {
  await reset();
  await publish("nse-2026-10-09-aaaa", "2026-10-09", KEYS);
  await publish("nse-2026-10-12-bbbb", "2026-10-12", ["screener_summary", "screener_stocks"], { movePointer: false }); // in progress
  const during = await reader(IST("2026-10-13", "07:40")).page("screener_summary");
  assert.equal(during.publication_id, "nse-2026-10-09-aaaa");
  assert.equal(during.as_of, "2026-10-09", "the date did not move in India's time zone");
  assert.equal(during.freshness.state, "publishing");
  assert.deepEqual(during.payload, PAGES.screener_summary);
  const failed = await reader(IST("2026-10-13", "09:15")).status();
  assert.equal(failed.freshness.state, "stale");
  assert.match(failed.freshness.reason ?? "", /NSE close of 2026-10-12 should have arrived by 08:30 IST and has not; this shows 2026-10-09/);
  await publish("nse-2026-10-12-bbbb", "2026-10-12", KEYS.slice(2)); // the run completes, the pointer moves last
  const done = await reader(IST("2026-10-13", "09:20")).page("overview_sectors");
  assert.equal(done.publication_id, "nse-2026-10-12-bbbb");
  assert.equal(done.freshness.state, "fresh");
});

test("the database adapters serve the published pages and say what no backend publishes", { skip }, async () => {
  const r = reader(IST("2026-10-13", "10:00"));
  const screener = azureScreenerData(r);
  const page = await screener.stocks("india", { u: "n500", sort: "d1", page: 1, page_size: 8 });
  assert.deepEqual(page.rows.map((x) => x.s), ex("getScreenerStocksIndia_india_gainers").rows.map((x: ScreenerStock) => x.s));
  assert.equal((await screener.fnoRows({ sort: "oi", page: 1, page_size: 25 })).total, day.fno.length);
  assert.deepEqual(await azureOverviewData(r).indices("india"), PAGES.overview_indices);
  assert.deepEqual(await azureOverviewData(r).flows(), PAGES.flows, "contract 2.5: flows are exepex/trading's");
  assert.deepEqual(await azureOverviewData(r).session("india"), PAGES.session);
  assert.deepEqual(await azureOverviewData(r).fnoEvents(), PAGES.fno_events);
  for (const read of [screener.tools("india"), screener.summary("us"), azureOverviewData(r).world("india")]) {
    await assert.rejects(read, (e) => e instanceof BlockEmpty && e.reason === "no_producer");
  }
});

test("W9-F&O: Home and the frame read P10's pages from the current publication", { skip }, async () => {
  await reset();
  await publish("nse-2026-10-12-eeee", "2026-10-12", KEYS);
  const r = reader(IST("2026-10-13", "10:00"));
  const home = fnoHomeData(r, fixtureHomeData);
  assert.deepEqual(await home.session("india"), PAGES.session);
  assert.deepEqual(await home.fnoBooks(), PAGES.risk);
  assert.deepEqual(await home.fnoEvents(), PAGES.fno_events);
  const frame = await fnoShellData(r, fixtureShellData, nseCalendar, () => IST("2026-10-13", "10:00")).read();
  assert.equal(frame.markets.india.items.NIFTY50.live, true);
  assert.deepEqual(frame.markets.india.fno_state, (PAGES.today as { fno_state: unknown }).fno_state);
  assert.deepEqual(frame.markets.india.fno_live?.missing, { session: undefined, indices: undefined, picks: undefined });
});

test("W9-F&O: a publication without P10's pages (today's P6) leaves each F&O part's reason, never an example", { skip }, async () => {
  await reset();
  await publish("nse-2026-10-12-ffff", "2026-10-12", KEYS.slice(0, 7));
  const frame = await fnoShellData(reader(IST("2026-10-13", "10:00")), fixtureShellData, nseCalendar, () => IST("2026-10-13", "10:00")).read();
  const missing = frame.markets.india.fno_live?.missing ?? {};
  for (const part of ["session", "indices", "picks"] as const) assert.match(missing[part] ?? "", /The current publication has no page for this part/, part);
  assert.deepEqual(frame.markets.india.indices, []);
  await assert.rejects(fnoHomeData(reader(IST("2026-10-13", "10:00")), fixtureHomeData).fnoBooks(), (e) => e instanceof BlockEmpty && e.reason === "page_missing");
});

test("empty with its reason: nothing published, or no such page in the current publication", { skip }, async () => {
  await reset();
  await assert.rejects(reader(IST("2026-10-13", "10:00")).page("screener_summary"), (e) => e instanceof BlockEmpty && e.reason === "not_published");
  await publish("nse-2026-10-12-cccc", "2026-10-12", ["screener_summary"]);
  await assert.rejects(reader(IST("2026-10-13", "10:00")).page("overview_indices"), (e) => e instanceof BlockEmpty && e.reason === "page_missing");
});

test("2. a payload of another major version is the incompatible state", { skip }, async () => {
  await reset();
  await publish("nse-2026-10-12-dddd", "2026-10-12", ["screener_summary"], { version: "3.0.0" });
  const error = await reader(IST("2026-10-13", "10:00")).page("screener_summary").catch((e) => e);
  assert.ok(error instanceof BlockIncompatible);
  assert.equal(outcomeOf("The screener", error).kind, "incompatible");
});

test("TLS: verified against the pinned roots and the server's name; anything else is refused", { skip }, async () => {
  const azureOnly = reader(new Date(), { ca: AZURE_POSTGRES_ROOTS });
  await assert.rejects(azureOnly.status(), (e) => e instanceof FnoUnavailable && e.failure === "tls");
  db.serveCertFor("elsewhere.example");
  try {
    await assert.rejects(reader(new Date()).status(), (e) => e instanceof FnoUnavailable && e.failure === "tls");
  } finally {
    db.serveCertFor("localhost");
  }
});

test("3. database errors reach the page as a class only: no driver text, host, user or password", { skip }, async () => {
  const secrets = [ROLE, "localhost", String(db.port), PASSWORD, "wrong-password", "password authentication", "permission denied"];
  const failures: [object, string][] = [[{ password: "wrong-password" }, "authentication"], [{ port: 1 }, "network"]];
  await db.admin.query(`revoke select on fno.current_publication from ${ROLE}`);
  try {
    failures.push([{}, "permission"]);
    for (const [over, failure] of failures) {
      const error = await reader(new Date(), over).status().catch((e) => e);
      assert.ok(error instanceof FnoUnavailable, failure);
      assert.equal(error.failure, failure);
      const page = outcomeOf("The screener", error);
      const shown = `${error.message} ${JSON.stringify(error)} ${page.title} ${page.detail} ${page.log}`;
      assert.equal(page.log, `The screener: FnoUnavailable (${failure})`);
      for (const s of secrets) assert.ok(!shown.includes(s), `${failure}: "${s}" would reach the page`);
      assert.equal(error.cause, undefined, "the driver's error is not kept");
    }
  } finally {
    await db.admin.query(`grant select on fno.current_publication to ${ROLE}`);
  }
});
