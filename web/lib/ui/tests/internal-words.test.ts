// The words that say how a strategy decides (owner, 13 Oct 2026), on the texts judge 70 found on live screens and on
// texts that must stay: the scan flags the first and never the second.
import assert from "node:assert/strict";
import { test } from "node:test";
import { internalWordsIn } from "../internal-words.ts";
import { publicWords, WITHHELD } from "../public-words.ts";

const FOUND_BY_JUDGE_70 = [
  "Chance of a rise 62% (its bar: 55%)", "an up call below its bar is never traded", "the strategy’s bar (55%)",
  "it trades only in calm markets (regime rule)", "Threshold 0.60: 41 trades", "variant at 55% threshold",
];
const RULE_NUMBERS = ["buys when the chance is at least 55%", "a chance of 60% or more", "Buys at 55%", "P(up) above 55% counts", "score clears 0.6 and 55%"];
const PUBLIC = [
  "Chance of a rise 62%, would buy.", "80% range narrower by 0.52%", "Will the close be up 3% or more by Friday?",
  "win rate 55% over 41 trades", "market mood calm → busy with events", "luck test (percentile bootstrap, 41 trades)",
  "read model rm.bars, scope strategy_regime, file design/catalogue/bar.json", "the thin line marks the spread",
];

test("flags each internal word the judge found, and every number tied to a rule", () => {
  for (const t of [...FOUND_BY_JUDGE_70, ...RULE_NUMBERS]) assert.ok(internalWordsIn(t).length > 0, `missed: ${t}`);
});

test("leaves public texts and the contract's codes alone", () => {
  for (const t of PUBLIC) assert.deepEqual(internalWordsIn(t), [], t);
});

test("a backend sentence: regime reads as market mood, bars as daily prices; one naming a setting is withheld whole", () => {
  assert.equal(publicWords("Regime is event-heavy, so the probability stays modest."), "Market mood is event-heavy, so the probability stays modest.");
  assert.equal(publicWords("ASSUMED constant 1.17 (no stored EURUSD bars)"), "ASSUMED constant 1.17 (no stored EURUSD daily prices)");
  assert.equal(publicWords("in the same market regime and horizon"), "in the same market mood and horizon");
  assert.equal(publicWords("strategy_regime"), "strategy_regime", "a code stays");
  assert.equal(publicWords("Up call but below its 55% bar, so no trade."), WITHHELD);
  assert.deepEqual(internalWordsIn(WITHHELD), []);
});
