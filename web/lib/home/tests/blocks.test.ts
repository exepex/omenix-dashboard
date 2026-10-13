// Story W9: the fixture adapter serves every Home block of both markets through HomeData; the group cards and the
// open-trade rows pass block figures through and never add anything up (criterion 4: the only sum is the publisher's
// per-group total; never across groups, markets or currencies).
import assert from "node:assert/strict";
import { test } from "node:test";
import { fixtureHomeData as home } from "../fixture-source.ts";
import { groupCard, groupCards } from "../groups.ts";
import { resolveSource } from "../sources.ts";
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
  const block = await home.groups("india");
  const { groups } = block;
  const { books } = await home.fnoBooks();
  groupCards(block, books).forEach((c, at) => {
    const g = groups[at];
    assert.equal(c.total, g.total, g.family);
    assert.equal(c.book, books.find((b) => b.family === g.family), g.family);
    for (const { result } of c.ran) assert.ok(g.strategies.includes(result), "each strategy's own result, as published");
  });
  const card = (family: string) => groupCard(block, groups.findIndex((g) => g.family === family), books);
  const rule = card("rule");
  assert.equal(rule.total?.net, -9309.36);
  assert.equal(rule.book?.pnl, 0);
  assert.equal(rule.totalLabel, "Stocks: total profit / loss");
  assert.equal(card("hybrid").total, null, "Hybrid: no strategy yet");
});

test("in the US a card has no F&O line and reads 'Total profit / loss'", async () => {
  for (const c of groupCards(await home.groups("us"), null)) {
    assert.equal(c.book, null);
    assert.equal(c.bookSrc, null);
    assert.equal(c.totalLabel, "Total profit / loss");
  }
});

// Judge 29, minor 3: a card's sources are named from its own group index, so each resolves to exactly its figure.
test("each group card's sources resolve to exactly the figures it shows; a neighbour's source would not", async () => {
  for (const m of MARKETS) {
    const groups = await home.groups(m);
    const fnoBooks = m === "india" ? await home.fnoBooks() : undefined;
    const blocks = { groups, fnoBooks };
    const cards = groupCards(groups, fnoBooks?.books ?? null);
    for (const c of cards) {
      if (c.total) assert.equal(resolveSource(c.totalSrc, blocks), c.total.net, c.totalSrc);
      if (c.book) assert.equal(resolveSource(c.bookSrc!, blocks), c.book.pnl, String(c.bookSrc));
      for (const { result, src } of c.ran) assert.equal(resolveSource(src, blocks), result.net, src);
    }
    // the mislabel the UI check must catch: the Rule-based figure under the AI team's source
    const [rule, ai] = [cards.find((c) => c.family === "rule")!, cards.find((c) => c.family === "ai")!];
    assert.notEqual(resolveSource(ai.totalSrc, blocks), rule.total?.net, `${m}: a mislabelled source resolves to another value`);
  }
});

test("open trades: yours first, then one row per stock and family; a row shows one trade's own figure, never a sum", async () => {
  const [{ own }, { strategy_trades }] = await Promise.all([home.positions("india"), home.strategyTrades("india")]);
  const rows = tradeRows(own, strategy_trades);
  assert.equal(rows[0].kind, "own");
  assert.deepEqual(["all", "manual", "rule", "hybrid", "ai", "baseline"].map((t) => rowsOf(rows, t as never).length), [6, 1, 1, 0, 2, 2]);
  for (const r of rows) {
    if (r.kind !== "group") continue;
    const f = groupFigures(r.entries);
    // every figure is one trade's own field, named by its index in the block (the source the screen shows)
    for (const e of [f.amount, f.low, f.high, ...(f.same ? [f.same] : [])]) assert.equal(strategy_trades[e.at], e.trade);
    assert.ok(r.entries.some((e) => e.trade === f.low.trade) && r.entries.some((e) => e.trade === f.high.trade), "the range ends are trades' own values");
  }
});

test("a group of trades with different results shows their range, still each trade's own value", () => {
  const t = (unrealised: number) => ({ id: "X", family: "rule" as const, strategy_id: "rule.a.v1", strategy: "A", horizon: 1, qty: 1, avg: 1, unrealised, exit: "2026-10-08", amount: 100, as_of: "" });
  const f = groupFigures([t(5), t(-3), t(5)].map((trade, at) => ({ trade, at })));
  assert.deepEqual([f.same, f.low.at, f.high.at], [null, 1, 0]);
  const same = groupFigures([t(4), t(4)].map((trade, at) => ({ trade, at })));
  assert.equal(same.same?.trade.unrealised, 4);
});
