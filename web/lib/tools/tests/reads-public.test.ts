// The MCP and Slack read tools answer through the same public view as /api/v1 (owner, 13 Oct 2026: no answer says how
// a strategy decides): a stored row with a registry, a prediction's settings and a sentence that states a bar reaches
// the assistant without any of them.
import assert from "node:assert/strict";
import { test } from "node:test";
import { internalWordsIn } from "../../ui/internal-words.ts";
import { runRead } from "../reads.ts";
import { FakeReadStore } from "./fakes.ts";

const SAY_BAR = "Up call, but below its 55% bar, so no trade.";
const STORED = {
  strategies: { "rule.model_news.v1": { id: "rule.model_news.v1", family: "rule", name: "Model + news", threshold: 0.55, parameters: { news_weight: 1 }, description: "Buys when the model gives 55%" } },
  predictions: [{ strategy_id: "rule.model_news.v1", prob_up: 0.6, threshold: 0.55, model_prob: 0.58, agent_adjustment: 0.02, reason: SAY_BAR }],
};

test("get_scoreboard serves the public view: no setting, no backend name or id, no sentence that states a bar", async () => {
  const store = new FakeReadStore();
  store.put("strategies", "india", "_", STORED);
  const data = await runRead(store, "get_scoreboard", { market: "india" });
  const text = JSON.stringify(data.sources[0].payload);
  for (const leak of ["threshold", "parameters", "description", "model_prob", "agent_adjustment", "0.55", "Model + news", "rule.model_news", SAY_BAR]) {
    assert.ok(!text.includes(leak), `the read tool leaks ${leak}`);
  }
  assert.deepEqual(internalWordsIn(text), []);
  assert.ok(text.includes("0.6"), "what the strategy decided is still served");
});
