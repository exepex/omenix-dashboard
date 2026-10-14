// Strategy internals stay private on every /api/v1 answer (owner, 13 Oct 2026; judge 70): every approved mockup's
// payload, as the API serves it (lib/ui/public-view.ts), carries no strategy setting and no sentence that says how a
// strategy decides; and the stock page, lifecycle, stock strategies and track record endpoints serve the public view even when the
// stored row carries a setting, a planted unknown one and a sentence that states a bar. The forbidden keys are named
// here literally, never read from the projection's own lists.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { COMPANY_PAGE, LIFECYCLE_PAGE, STOCK_STRATEGIES_PAGE } from "../../data/company.ts";
import { readPage, type PageSpec } from "../../data/handler.ts";
import { TRACK_RECORD_PAGE } from "../../data/track-record.ts";
import { MemoryRowStore, NOW, row } from "../../data/tests/fakes.ts";
import { internalWordsIn } from "../../ui/internal-words.ts";
import { publicView } from "../../ui/public-view.ts";

const mockups = join(import.meta.dirname, "..", "..", "..", "..", "design", "mockups");
const read = (name: string) => JSON.parse(readFileSync(join(mockups, name, "data.json"), "utf8").replace(/: NaN\b/g, ": null"));
/** A real stored forecast history (HDFCBANK, B12), with how each run was made: no mockup carries one yet. */
const HISTORY = JSON.parse(readFileSync(join(import.meta.dirname, "..", "..", "company-pages", "tests", "fixtures", "forecast-history-hdfcbank.json"), "utf8"));
const MOCKUPS = readdirSync(mockups).filter((d) => /^\d\d-/.test(d)).filter((d) => { try { read(d); return true; } catch { return false; } });

const SETTINGS = ["threshold", "bar", "parameters", "differs_in", "compared_to", "model_prob", "agent_adjustment", "adjustment_reason", "description"];
const HOW_MADE = ["groups", "drivers_up", "drivers_down", "base_rate", "prob_model", "news_score", "inputs", "calibration_id", "sigma_h", "center"];

/** Every problem of a served value: a setting key, a forecast run's how-made key, an internal word in a sentence (a
 *  value with a space; a one-word value is a code of the contract, like a section key "regimes"). */
function problems(value: unknown, path = "", list = ""): string[] {
  if (typeof value === "string") return /\s/.test(value) ? internalWordsIn(value).map((w) => `${path}: ${w}`) : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => problems(v, `${path}[${i}]`, path.split(".").pop()));
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([k, v]) => [
    ...(SETTINGS.includes(k) && !path.endsWith(".strategies") ? [`${path}.${k}: a setting`] : []),
    ...(HOW_MADE.includes(k) && (list === "ranges" || list === "scores" || path.endsWith(".change")) ? [`${path}.${k}: how a forecast was made`] : []),
    ...(k === "changed" && Array.isArray(v) ? v.filter((f) => HOW_MADE.includes(String(f))).map((f) => `${path}.changed names ${f}`) : []),
    ...problems(v, `${path}.${k}`, list),
  ]);
}

test("the scan sees the internals in the stored mockups (it is not blind)", () => {
  const raw = MOCKUPS.flatMap((m) => problems(read(m), m));
  assert.ok(raw.some((p) => p.endsWith(".threshold: a setting")), "a stored threshold");
  assert.ok(raw.some((p) => p.includes("regime")), "a stored sentence with regime");
  const history = problems(HISTORY, "history");
  for (const made of ["inputs: how", "calibration_id: how", "groups: how", "changed names"]) assert.ok(history.some((p) => p.includes(made)), `the stored history's ${made}`);
});

test("every mockup's payload as the API serves it: no setting, no how-made field, no internal word", () => {
  assert.ok(MOCKUPS.length >= 15, `only ${MOCKUPS.length} mockups read`);
  for (const m of MOCKUPS) assert.deepEqual(problems(publicView(read(m)), m).slice(0, 5), [], m);
});

const SAY_BAR = "Up call, but below its 55% bar, so no trade.";
const PLANTED = { threshold: 0.55, model_prob: 0.58, agent_adjustment: -0.02, adjustment_reason: "calm regime, chance at least 55%", planted_bar: SAY_BAR };
const prediction = (strategy_id: string) => ({ id: `p-${strategy_id}`, strategy_id, prob_up: 0.6, qualifies: true, reason: SAY_BAR, ...PLANTED });

const ENDPOINTS: Array<[string, PageSpec, string, Record<string, unknown>]> = [
  ["lifecycle", LIFECYCLE_PAGE, "stocks/RELIANCE/lifecycle/2026-10-06", { predictions: [prediction("rule.model_news.v1"), prediction("ai.combined.opus.v1")], prediction_reasons: [{ prediction_id: "p", reason: SAY_BAR }] }],
  ["stock strategies", STOCK_STRATEGIES_PAGE, "stocks/RELIANCE/strategies", { predictions: [prediction("rule.model_news_strict.v1")], strategies: { "rule.model_news.v1": { id: "rule.model_news.v1", family: "rule", name: "Model + news", threshold: 0.55, parameters: { news_weight: 1 } } } }],
  ["stock page", COMPANY_PAGE, "stocks/RELIANCE", { ticker: "RELIANCE", forecast_history: HISTORY, predictions: [prediction("rule.model_news_calm.v1")] }],
  ["track record", TRACK_RECORD_PAGE, "track-record", { rows: [{ baseline: "always", threshold: 0.55, trades: 4, note: SAY_BAR }, { baseline: "always", threshold: 0.6, trades: 2 }] }],
];

for (const [name, spec, path, payload] of ENDPOINTS) {
  test(`GET ${name}: the public view even when the stored row carries settings and a sentence that states a bar`, async () => {
    const store = new MemoryRowStore().put(spec.table, row({ market: "india", page_key: "_", payload: { ...payload, status: { market: "india" } } }));
    const response = await readPage(new Request(`https://app.test/api/v1/markets/india/${path}`), spec, "india", "_", { store, now: () => NOW });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(problems(body.payload, name), []);
    const text = JSON.stringify(body);
    for (const leak of ["0.55", "0.58", "Model + news", "rule.model_news", SAY_BAR]) assert.ok(!text.includes(leak), `${name} leaks ${leak}`);
  });
}

test("track record: the sweep's rows keep apart by a neutral variant letter", () => {
  const out = publicView({ rows: [{ baseline: "a", threshold: 0.6 }, { baseline: "a", threshold: 0.55 }] });
  assert.deepEqual(out.rows, [{ baseline: "a", variant: "B" }, { baseline: "a", variant: "A" }]);
});
