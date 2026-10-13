// Story W2: the route's query step over a stored table gives exactly W11's example pages. The whole day's table is
// 33-screener's data.json (the same split-adjusted rows the examples were cut from); every example with an x-query is
// rebuilt from it, row by row.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import type { FnoScreenerRow, ScreenerStock } from "../contract.ts";
import { pageFnoRows, pageStocks, type Table } from "../query-engine.ts";

const repo = join(import.meta.dirname, "..", "..", "..", "..");
const data = JSON.parse(readFileSync(join(repo, "design/mockups/33-screener/data.json"), "utf8")).markets.india;
const examples = JSON.parse(readFileSync(join(repo, "api/examples/blocks-33-34.json"), "utf8")) as Record<string, { "x-query"?: Record<string, unknown>; value: { payload: Record<string, unknown> } }>;
// One value differs between the two signed-off files (reported in response W2): the example has HALEOSLABS's 1-year change
// empty, data.json has 35.18. Neither file is ours to edit; the step is proved on every other field.
const KNOWN_DIFFERENCES: Record<string, (keyof ScreenerStock)[]> = { HALEOSLABS: ["y1"] };
const comparable = (r: ScreenerStock) => Object.fromEntries(Object.entries(r).filter(([k]) => !KNOWN_DIFFERENCES[r.s]?.includes(k as keyof ScreenerStock)));
const strip = ({ k: _k, ...r }: ScreenerStock & { k?: unknown }) => r;
const byValue = (a: ScreenerStock, b: ScreenerStock) => b.p * b.v - a.p * a.v;
const stocks: Table<ScreenerStock> = { as_of: "2026-10-12T10:00:00Z", currency: "INR", total: data.stocks.length, rows: data.stocks.map(strip).sort(byValue) };
const fno: Table<FnoScreenerRow> = { as_of: "2026-10-12T10:00:00Z", currency: "INR", total: data.fno.length, rows: [...data.fno].sort((a: FnoScreenerRow, b: FnoScreenerRow) => b.oi * b.fut - a.oi * a.fut) };

test("every India stock example is the query step over the day's table, row by row", () => {
  const cases = Object.entries(examples).filter(([op, e]) => op.startsWith("getScreenerStocksIndia_") && e["x-query"]);
  assert.ok(cases.length >= 12);
  for (const [op, e] of cases) {
    const got = pageStocks(stocks, e["x-query"] as never);
    const want = e.value.payload as { total: number; rows: ScreenerStock[] };
    assert.equal(got.total, want.total, `${op} total`);
    assert.deepEqual(got.rows.map((r) => r.s), want.rows.map((r) => r.s), `${op} rows`);
    assert.deepEqual(got.rows.map(comparable), want.rows.map(comparable), `${op} fields`);
  }
});

test("every F&O example is the query step over the day's underlyings", () => {
  const cases = Object.entries(examples).filter(([op, e]) => op.startsWith("getFnoScreenerRows_") && e["x-query"]);
  assert.ok(cases.length >= 5);
  for (const [op, e] of cases) {
    const got = pageFnoRows(fno, e["x-query"] as never);
    const want = e.value.payload as { total: number; rows: FnoScreenerRow[] };
    assert.equal(got.total, want.total, `${op} total`);
    assert.deepEqual(got.rows.map((r) => r.s), want.rows.map((r) => r.s), `${op} rows`);
  }
});

test("ties go by value traded, then symbol, whatever the stored order", () => {
  const row = (s: string, p: number, v: number, d1: number | null) => ({ ...stocks.rows[0], s, p, v, d1 });
  const table = { ...stocks, rows: [row("C", 10, 5, 2), row("A", 10, 1, 2), row("B", 10, 5, 2), row("D", 1, 50, null)] };
  assert.deepEqual(pageStocks(table, { u: "all", sort: "d1", page: 1, page_size: 9 }).rows.map((r) => r.s), ["B", "C", "A", "D"]);
  assert.deepEqual(pageStocks(table, { u: "all", sort: "abs", page: 1, page_size: 9 }).rows.map((r) => r.s), ["B", "C", "A", "D"]);
});

test("empty values sort last both ways; a later page continues the order", () => {
  const up = pageStocks(stocks, { u: "all", sort: "r", page: 1, page_size: 100 });
  const down = pageStocks(stocks, { u: "all", sort: "-r", page: 1, page_size: 100 });
  assert.ok(up.rows.every((r) => r.r !== null) && down.rows.every((r) => r.r !== null));
  const p1 = pageStocks(stocks, { u: "all", sort: "value", page: 1, page_size: 25 });
  const p2 = pageStocks(stocks, { u: "all", sort: "value", page: 2, page_size: 25 });
  assert.equal(p2.rows[0].s, stocks.rows[25].s);
  assert.equal(p1.total, 2924);
});
