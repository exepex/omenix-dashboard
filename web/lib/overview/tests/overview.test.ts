// Story W12: the Markets overview's state, the movers' route query, and the readings it takes from block fields only
// (the VIX's 3-month middle, the flows' coverage). The US never asks for India-only blocks.
import assert from "node:assert/strict";
import { test } from "node:test";
import { NoExample } from "../../ui/no-example.ts";
import { fixtureScreenerData } from "../../screener/fixture-source.ts";
import { fixtureOverviewData as data } from "../fixture-source.ts";
import { marketsSearch, moversQuery, readMarketsState } from "../state.ts";
import { coverage, middle63, tone } from "../view.ts";

test("the URL state reads the signed-off keys and writes back only what differs", () => {
  const s = readMarketsState({ per: "y1", idx: "NIFTY Midcap 100", sec: "industry", mov: "losers", mu: "all" });
  assert.deepEqual(s, { per: "y1", idx: "NIFTY Midcap 100", br: "all", sec: "industry", mov: "losers", mu: "all" });
  assert.equal(marketsSearch(readMarketsState({})), "");
  assert.deepEqual(readMarketsState(Object.fromEntries(new URLSearchParams(marketsSearch(s).slice(1)))), s);
});

test("movers are pages of the Screener's stocks block: the signed-off lists' queries; only the gainers have examples", async () => {
  const st = (p: Record<string, string>) => readMarketsState(p);
  assert.deepEqual(moversQuery(st({}), "india"), { u: "n500", sort: "d1", page: 1, page_size: 8 });
  assert.deepEqual(moversQuery(st({ mov: "active", mu: "all" }), "india"), { u: "all", vamin: 100000, pmin: 20, sort: "value", page: 1, page_size: 8 });
  assert.deepEqual(moversQuery(st({ mov: "losers" }), "us"), { u: "ours", sort: "-d1", page: 1, page_size: 5 });
  assert.equal((await fixtureScreenerData.stocks("india", moversQuery(st({}), "india"))).rows.length, 8);
  await assert.rejects(fixtureScreenerData.stocks("india", moversQuery(st({ mov: "losers" }), "india")), NoExample);
});

test("the VIX's 3-month middle is the median of its last 63 closes (the example states 12.16)", async () => {
  const vix = (await data.indices("india")).indices.find((q) => q.kind === "vol")!;
  assert.equal(middle63(vix), 12.16);
});

test("a flows total shows only when the days cover the period; otherwise the coverage, never a sum on screen", async () => {
  const f = await data.flows();
  assert.equal(coverage(f.totals.w1), null);
  assert.equal(f.totals.w1.fii, -30294.29);
  assert.equal(coverage(f.totals.m1), "only 5 days of data for 21 sessions");
  assert.equal(f.totals.m1.fii, null);
});

test("sector tiles are shaded by sign and size, never by colour alone (the number and sign are always shown)", () => {
  assert.equal(tone(6.44, "m1"), "up s2");
  assert.equal(tone(-10.76, "m1"), "down s3");
  assert.equal(tone(-0.34, "d1"), "down s1");
  assert.equal(tone(null, "m1"), "");
});
