// Story W9: the fixture adapter serves every Home block of both markets through HomeData; the group cards and the
// open-trade rows pass block figures through and never add anything up (criterion 4: the only sum is the publisher's
// per-group total; never across groups, markets or currencies).
import assert from "node:assert/strict";
import { test } from "node:test";
import { fixtureHomeData as home } from "../fixture-source.ts";
import { groupCard } from "../groups.ts";
import { groupFigures, rowsOf, tradeRows } from "../trades.ts";

const MARKETS = ["india", "us"] as const;

test("every block of both markets reads, in the market's own currency; F&O books exist for India only", async () => {
  for (const m of MARKETS) {
    const cur = m === "india" ? "INR" : "USD";
    const [groups, trades, accounts, positions] = await Promise.all([home.groups(m), home.strategyTrades(m), home.accounts(m), home.positions(m)]);
    assert.equal(groups.currency, cur);
    assert.equal(trades.currency, cur);
    assert.equal(accounts.currency, cur);
    assert.equal(positions.currency, cur);
    for (const read of [home.session, home.trackedMoves, home.attention, home.events, home.topNews]) assert.ok(await read(m));
  }
  const books = await home.fnoBooks();
  assert.equal(books.currency, "INR");
  assert.deepEqual(books.books.map((b) => [b.book, b.family]), [[1, "rule"], [2, "hybrid"], [3, "ai"]]);
  assert.equal(home.fnoBooks.length, 0, "fnoBooks takes no market: there is no US F&O to ask for");
});

test("a group card's headline is the block's own total; its F&O line is its book's own figure, not added in", async () => {
  const { groups } = await home.groups("india");
  const { books } = await home.fnoBooks();
  for (const g of groups) {
    const c = groupCard(g, books);
    assert.equal(c.total, g.total, g.family);
    assert.equal(c.book, books.find((b) => b.family === g.family), g.family);
    for (const s of c.ran) assert.ok(g.strategies.includes(s), "each strategy's own result, as published");
  }
  const rule = groupCard(groups.find((g) => g.family === "rule")!, books);
  assert.equal(rule.total?.net, -9309.36);
  assert.equal(rule.book?.pnl, 0);
  assert.equal(rule.totalLabel, "Stocks: total profit / loss");
  assert.equal(groupCard(groups.find((g) => g.family === "hybrid")!, books).total, null, "Hybrid: no strategy yet");
});

test("in the US a card has no F&O line and reads 'Total profit / loss'", async () => {
  const { groups } = await home.groups("us");
  for (const g of groups) {
    const c = groupCard(g, null);
    assert.equal(c.book, null);
    assert.equal(c.totalLabel, "Total profit / loss");
  }
});

test("open trades: yours first, then one row per stock and family; a row shows one trade's own figure, never a sum", async () => {
  const [{ own }, { strategy_trades }] = await Promise.all([home.positions("india"), home.strategyTrades("india")]);
  const rows = tradeRows(own, strategy_trades);
  assert.equal(rows[0].kind, "own");
  assert.deepEqual(["all", "manual", "rule", "hybrid", "ai", "baseline"].map((t) => rowsOf(rows, t as never).length), [6, 1, 1, 0, 2, 2]);
  for (const r of rows) {
    if (r.kind !== "group") continue;
    const f = groupFigures(r.trades);
    const own = r.trades.map((t) => t.unrealised);
    if (f.pnl !== null) assert.ok(own.includes(f.pnl));
    assert.ok(own.includes(f.low) && own.includes(f.high), "the range ends are trades' own values");
  }
});

test("a group of trades with different results shows their range, still each trade's own value", () => {
  const t = (unrealised: number) => ({ id: "X", family: "rule" as const, strategy_id: "rule.a.v1", strategy: "A", horizon: 1, qty: 1, avg: 1, unrealised, exit: "2026-10-08", amount: 100, as_of: "" });
  const f = groupFigures([t(5), t(-3), t(5)]);
  assert.deepEqual([f.pnl, f.low, f.high], [null, -3, 5]);
});
