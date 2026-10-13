// Strategy internals stay private (owner, 13 Oct 2026): the Strategy lab's API answer carries what each strategy
// decided and how it did, never its description, parameters, chance threshold or the setting it changes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { readPage } from "../../data/handler.ts";
import { STRATEGY_LAB_PAGE } from "../../data/strategy-lab.ts";
import { MemoryRowStore, NOW, row } from "../../data/tests/fakes.ts";
import { INTERNAL_KEYS, withoutInternals } from "../public-strategies.ts";

const repo = join(import.meta.dirname, "..", "..", "..", "..");
const lab = JSON.parse(readFileSync(join(repo, "design", "mockups", "05-strategy-lab", "data.json"), "utf8").replace(/: NaN\b/g, ": null")).markets.india;

test("the projection drops every internal field and keeps the rest", () => {
  const out = withoutInternals(lab) as typeof lab;
  assert.equal(Object.keys(out.strategies).length, Object.keys(lab.strategies).length);
  for (const [id, entry] of Object.entries(out.strategies) as [string, Record<string, unknown>][]) {
    for (const key of INTERNAL_KEYS) assert.ok(!(key in entry), `${id} still carries ${key}`);
    for (const key of ["id", "family", "name", "horizons", "live", "settled_trades"]) assert.deepEqual(entry[key], lab.strategies[id][key], `${id} lost ${key}`);
  }
  assert.deepEqual(out.rows, lab.rows, "the results are untouched");
  assert.equal(withoutInternals(null), null);
  assert.deepEqual(withoutInternals({ a: 1 }), { a: 1 });
});

test("GET /strategies serves the stored registry without internals", async () => {
  const store = new MemoryRowStore().put("strategies", row({ market: "india", payload: { ...lab, status: { market: "india" } } }));
  const response = await readPage(new Request("https://app.test/api/v1/markets/india/strategies"), STRATEGY_LAB_PAGE, "india", "_", { store, now: () => NOW });
  assert.equal(response.status, 200);
  const text = await response.text();
  for (const key of INTERNAL_KEYS) assert.ok(!text.includes(`"${key}"`), `the answer carries ${key}`);
  for (const words of ["news_weight", "regime_filter", "sees_model_score", "Buys when the model gives"]) assert.ok(!text.includes(words), `the answer carries "${words}"`);
  assert.ok(text.includes('"settled_trades"') && text.includes('"rows"'));
});
