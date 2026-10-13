// Strategy internals stay private (owner, 13 Oct 2026): the Strategy lab's API answer carries what each strategy
// decided and how it did, never how it decides. The forbidden fields and words are named here literally (never read
// from the projection's own list), and a field no registry has yet is planted: neither may reach the answer.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { readPage } from "../../data/handler.ts";
import { STRATEGY_LAB_PAGE } from "../../data/strategy-lab.ts";
import { MemoryRowStore, NOW, row } from "../../data/tests/fakes.ts";
import { withoutInternals } from "../public-strategies.ts";

const repo = join(import.meta.dirname, "..", "..", "..", "..");
const lab = JSON.parse(readFileSync(join(repo, "design", "mockups", "05-strategy-lab", "data.json"), "utf8").replace(/: NaN\b/g, ": null")).markets.india;

/** The registry with a setting no registry has yet, on every strategy (a future field must stay private by default). */
const PLANTED = "planted_secret_setting", PLANTED_VALUE = "PLANTED-SECRET-RULE-0.42";
const planted = { ...lab, strategies: Object.fromEntries(Object.entries(lab.strategies).map(([id, s]) => [id, { ...(s as object), [PLANTED]: PLANTED_VALUE }])) };

const FORBIDDEN_KEYS = ["description", "parameters", "threshold", "differs_in", "compared_to", "news_weight", "regime_filter", "sees_model_score", "news_statuses", "news_materiality", "cross_market", "signal", "inputs", "model", PLANTED];
const FORBIDDEN_TEXT = ["Buys when the model gives", "news counts half", "0.55", PLANTED_VALUE];
const PUBLIC = { id: "string", family: "string", name: "string", horizons: "object", live: "boolean", settled_trades: "number" };

test("the stored registry really carries the internals this test guards against", () => {
  const ref = lab.strategies["rule.model_news.v1"];
  assert.equal(ref.threshold, 0.55);
  assert.equal(ref.parameters.news_weight, 1);
  assert.ok(typeof ref.description === "string" && ref.description.length > 20);
});

test("the projection keeps exactly the public fields: no internal, no unknown field, every result untouched", () => {
  const out = withoutInternals(planted) as typeof lab;
  assert.deepEqual(Object.keys(out.strategies), Object.keys(lab.strategies));
  for (const [id, entry] of Object.entries(out.strategies) as [string, Record<string, unknown>][]) {
    for (const key of FORBIDDEN_KEYS) assert.ok(!(key in entry), `${id} carries ${key}`);
    for (const [key, type] of Object.entries(PUBLIC)) assert.equal(typeof entry[key], type, `${id} lost ${key}`);
    assert.deepEqual(Object.keys(entry).sort(), ["family", "horizons", "id", "live", "live_from", "name", "settled_trades"].filter((k) => k in lab.strategies[id]).sort());
  }
  assert.deepEqual(out.rows, lab.rows, "the results are untouched");
  assert.equal(withoutInternals(null), null);
  assert.deepEqual(withoutInternals({ a: 1 }), { a: 1 });
});

test("GET /strategies serves the registry without internals, and a planted new field does not leak", async () => {
  const store = new MemoryRowStore().put("strategies", row({ market: "india", payload: { ...planted, status: { market: "india" } } }));
  const response = await readPage(new Request("https://app.test/api/v1/markets/india/strategies"), STRATEGY_LAB_PAGE, "india", "_", { store, now: () => NOW });
  assert.equal(response.status, 200);
  const body = await response.json();
  const strategies = JSON.stringify(body.payload.strategies);
  for (const key of FORBIDDEN_KEYS) assert.ok(!strategies.includes(`"${key}"`), `the answer's strategies carry ${key}`);
  for (const words of FORBIDDEN_TEXT) assert.ok(!strategies.includes(words), `the answer's strategies carry "${words}"`);
  assert.ok(!JSON.stringify(body).includes(PLANTED_VALUE), "the planted setting leaked somewhere in the answer");
  assert.equal(Object.keys(body.payload.strategies).length, Object.keys(lab.strategies).length);
  assert.ok(Array.isArray(body.payload.rows) && body.payload.rows.length > 0, "the results are served");
});
