// Story W12: the Screener's URL state and route queries (W11), the examples each query is answered by, and the counts'
// sources. Every count a screen shows is the summary block's field; the two tools-based screens count the followed
// companies as the contract defines.
import assert from "node:assert/strict";
import { test } from "node:test";
import { NoExample } from "../../ui/no-example.ts";
import { resolveSource } from "../../ui/sources.ts";
import { fixtureScreenerData as data } from "../fixture-source.ts";
import { STOCK_SCREENS, screenCount, screensOf, toolsOrder, toolsSymbols } from "../screens.ts";
import { fnoQuery, readState, stateSearch, stocksQuery } from "../state.ts";

test("the URL state reads the signed-off keys, falls back to defaults, and writes back only what differs", () => {
  const s = readState({ uni: "n500", pre: "oversold", per: "y1", sort: "chg", pg: "2", f: "pmin:100,cmin:5,dl:60,bad:x", fopen: "1" }, "india");
  assert.deepEqual([s.tab, s.uni, s.pre, s.per, s.sort, s.page, s.filters, s.filtersOpen], ["stocks", "n500", "oversold", "y1", "chg", 2, { pmin: 100, cmin: 5, dl: 60 }, true]);
  assert.equal(readState(Object.fromEntries(new URLSearchParams(stateSearch(s).slice(1))), "india").filters.dl, 60);
  assert.equal(stateSearch(readState({}, "india")), "");
  assert.deepEqual(readState({ uni: "xx", per: "zz", pg: "-3" }, "india").page, 1);
});

test("the US has one universe, no F&O tab and no delivery (absent, not empty)", () => {
  const s = readState({ tab: "fno", uni: "all", pre: "delivery", f: "dl:70" }, "us");
  assert.deepEqual([s.tab, s.uni, s.pre, s.filters], ["stocks", "ours", "", {}]);
  assert.ok(!screensOf(false).some((d) => d.key === "delivery"));
});

test("route queries: a screen brings its own order; filters map to the route's names; tools-based screens send symbols", async () => {
  const tools = await data.tools("india");
  assert.deepEqual(stocksQuery(readState({}, "india"), tools), { u: "all", sort: "value", page: 1, page_size: 25 });
  assert.deepEqual(stocksQuery(readState({ pre: "high" }, "india"), tools), { u: "all", screen: "high", sort: "pos", page: 1, page_size: 25 });
  assert.deepEqual(stocksQuery(readState({ f: "cmin:5,vr:3,dl:60", per: "w1" }, "india"), tools), { u: "all", period: "w1", cmin: 5, vrmin: 3, dlmin: 60, sort: "value", page: 1, page_size: 25 });
  const picks = stocksQuery(readState({ pre: "picks" }, "india"), tools);
  assert.deepEqual(picks.symbols, tools.companies.filter((c) => c.strategies.buy >= 3).map((c) => c.s));
  assert.equal(picks.screen, undefined);
  assert.deepEqual(fnoQuery(readState({ tab: "fno", fpre: "ivhigh" }, "india")), { screen: "ivhigh", sort: "ivr", page: 1, page_size: 25 });
});

test("each paged example answers only the query it was taken with; any other view is NoExample, never other rows", async () => {
  const tools = await data.tools("india");
  const q = (p: Record<string, string>) => stocksQuery(readState(p, "india"), tools);
  assert.equal((await data.stocks("india", q({}))).total, 2924);
  const near = (await data.summary("india")).universes.all!.near_high;
  assert.equal((await data.stocks("india", q({ pre: "high" }))).total, near, "the screen's rows are as many as its count");
  const summary = await data.summary("india");
  // W11's examples for the signed-off states (round 2): each screen's rows are as many as its own count field
  for (const [pre, uni, field] of [["volume", "all", "volume"], ["oversold", "n500", "oversold"]] as const) assert.equal((await data.stocks("india", q({ pre, uni }))).total, summary.universes[uni]!.screens[field], pre);
  assert.equal((await data.stocks("india", q({ uni: "ours" }))).total, 20);
  assert.equal((await data.stocks("india", q({ pre: "picks" }))).total, toolsSymbols(tools, "picks").length, "the picks' symbols, whatever their order, find the example");
  await assert.rejects(data.stocks("india", q({ pre: "trend" })), NoExample);
  await assert.rejects(data.stocks("india", q({ pg: "2" })), NoExample);
  assert.equal((await data.stocks("us", stocksQuery(readState({}, "us"), await data.tools("us")))).rows.length, 20);
  assert.equal((await data.fnoRows(fnoQuery(readState({ tab: "fno" }, "india")))).total, 219);
  assert.equal((await data.fnoRows(fnoQuery(readState({ tab: "fno", fpre: "index" }, "india")))).total, (await data.fnoSummary()).screens.index);
  await assert.rejects(data.fnoRows(fnoQuery(readState({ tab: "fno", fpre: "ivlow" }, "india"))), NoExample);
});

test("every screen's count is its summary field (resolved by its source path), except the two tools-based ones", async () => {
  for (const m of ["india", "us"] as const) {
    const [summary, tools] = await Promise.all([data.summary(m), data.tools(m)]);
    for (const [uni, counts] of Object.entries(summary.universes)) {
      for (const def of screensOf(m === "india")) {
        const { n, path } = screenCount(def, uni as never, counts!, tools);
        if (path) assert.equal(resolveSource(`summary:${path}`, { summary }), n, `${m} ${uni} ${def.key}`);
        else assert.equal(n, toolsSymbols(tools, def.key as "picks" | "results").length);
      }
    }
  }
  assert.equal(STOCK_SCREENS.filter((d) => d.field === null).map((d) => d.key).join(), "picks,results");
});

test("picks read most buying first and results soonest first, ordered on the page by the tools block, each row keeping its source index", async () => {
  const tools = await data.tools("india");
  const by = new Map(tools.companies.map((c) => [c.s, c]));
  for (const key of ["picks", "results"] as const) {
    const page = await data.stocks("india", stocksQuery(readState({ pre: key }, "india"), tools));
    const ordered = toolsOrder(page.rows, tools, key);
    ordered.forEach(({ r, i }) => assert.equal(page.rows[i], r, "the index is the row's place in the block"));
    const values = ordered.map(({ r }) => (key === "picks" ? -by.get(r.s)!.strategies.buy : by.get(r.s)!.days_to_results!));
    assert.deepEqual(values, [...values].sort((a, b) => a - b), key);
    for (let k = 1; k < ordered.length; k++) if (values[k] === values[k - 1]) assert.ok(ordered[k - 1].r.s.localeCompare(ordered[k].r.s) < 0, "ties by symbol");
  }
});
