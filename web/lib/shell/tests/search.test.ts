// Story W8 AC3: the one search box finds a stock by name and by ticker and an option by its NSE code; in the US market
// it finds no F&O instrument.
import assert from "node:assert/strict";
import { test } from "node:test";
import { GROUP_ORDER, matches, nothingFound, search } from "../search.ts";
import { frame, payload } from "./helpers.ts";

const india = frame("india").shell;
const us = frame("us").shell;
const ids = (rows: ReturnType<typeof search>) => rows.map((r) => r.instrumentId).filter(Boolean);

test("India finds a stock by its company name", () => {
  const rows = search(india, "reliance industries");
  assert.equal(rows[0].instrumentId, "RELIANCE");
  assert.equal(rows[0].group, "Stocks");
});

test("India finds a stock by its ticker, in any case", () => {
  assert.ok(ids(search(india, "hdfcbank")).includes("HDFCBANK"));
  assert.ok(ids(search(india, "MARUTI")).includes("MARUTI"));
});

test("India finds an option by its NSE trading code, whole or in lower case", () => {
  for (const q of ["NIFTY26OCT22800CE", "nifty26oct22800ce", " NIFTY26OCT22800CE "]) {
    const rows = search(india, q);
    assert.deepEqual(ids(rows), ["NIFTY26OCT22800CE"], q);
    assert.equal(rows[0].group, "F&O contracts");
  }
});

test("India finds an option by its words, with call and put read as CE and PE", () => {
  assert.deepEqual(ids(search(india, "nifty 22800 call")), ["NIFTY26OCT22800CE"]);
  assert.deepEqual(ids(search(india, "22800 put")), ["NIFTY26OCT22800PE"]);
  assert.ok(ids(search(india, "nifty future")).includes("NIFTY26OCTFUT"));
});

test("the US market finds no F&O instrument, by code or by words, and says F&O is India only", () => {
  for (const q of ["NIFTY26OCT22800CE", "nifty 22800 call", "nifty", "fut", "option chain"]) {
    const rows = search(us, q);
    assert.ok(!rows.some((r) => r.group === "F&O contracts" || r.group === "F&O underlyings"), q);
    assert.ok(!rows.some((r) => /option chain|strategy builder/i.test(r.label)), `${q}: an India-only page`);
  }
  assert.deepEqual(search(us, "NIFTY26OCT22800CE"), []);
  assert.match(nothingFound(us, "NIFTY26OCT22800CE"), /F&O is India only/);
  // the payload itself has US data, and the frame data of the US carries no F&O kind at all
  assert.ok(Object.values(us.items).every((i) => i.kind === "stock" || i.kind === "index"));
  assert.ok(payload.markets.us.items.AAPL);
});

test("the US finds its own stocks by name and ticker", () => {
  assert.ok(ids(search(us, "nvidia")).includes("NVDA"));
  assert.ok(ids(search(us, "aapl")).includes("AAPL"));
});

test("an empty query lists the recently viewed instruments, then pages", () => {
  const rows = search(india, "");
  assert.deepEqual(rows.filter((r) => r.group === "Recently viewed").map((r) => r.instrumentId), india.recent);
  assert.ok(rows.some((r) => r.group === "Pages"));
});

test("a code shorter than three characters does not match by code alone", () => {
  const row = search(india, "NIFTY26OCT22800CE")[0];
  assert.equal(matches(row, "ce"), true, "words still match");
  assert.equal(matches(row, "zz"), false);
});

test("results stay in the fixed group order, at most six a group", () => {
  const rows = search(india, "news");
  const order = rows.map((r) => r.group);
  const rank = order.map((g) => GROUP_ORDER.indexOf(g));
  assert.deepEqual(rank, [...rank].sort((a, b) => a - b));
  for (const g of new Set(order)) assert.ok(order.filter((x) => x === g).length <= 6, g);
});
