// Our own strategies' sentences in the dashboard's words (owner, 13 Oct 2026: no screen says how a strategy decides,
// and the cockpit says "market mood" for the market regime it shows). The stock tool writes some sentences about its
// strategies (an AI trader's reason, a lesson, a deviation note, a luck test's method, a back-test note or verdict) in its own
// vocabulary: "regime" there is the market mood, "bars" the stored daily prices. Only those fields change (OWN_SENTENCES):
// third-party text (news headlines, results, filings) is never touched, so "new tax regime" stays as published
// (judge 76). Codes (a value without a space) stay as the contract has them. A sentence of ours that still names how a
// strategy decides (a lone "bar", a threshold, a number tied to a rule: lib/ui/internal-words.ts) cannot be reworded
// into a public one, so it is withheld whole and the reader sees that it was. Pure.
import { internalWordsIn } from "./internal-words.ts";

/** What a reader sees in place of a sentence that stated a strategy's setting. */
export const WITHHELD = "(withheld: this text said how a strategy decides)";

const WORDS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(?:[Mm]arket )?regimes\b/g, "market moods"], [/\b(?:Market )?Regimes\b/g, "Market moods"],
  [/\b(?:[Mm]arket )?regime\b/g, "market mood"], [/\b(?:Market )?Regime\b/g, "Market mood"],
  [/\bbars\b/g, "daily prices"], [/\bBars\b/g, "Daily prices"],
];

/** One sentence in the dashboard's words (or WITHHELD); a code (no space) is returned as it is. */
export function publicWords(text: string): string {
  if (!/\s/.test(text)) return text;
  const words = WORDS.reduce((t, [re, to]) => t.replace(re, to), text);
  return internalWordsIn(words).length ? WITHHELD : words;
}

/** Our own sentence fields, by the list or object that holds them (`strategy`: the track record's back-test sweep); any record of a strategy's decision (an object
 *  with a `strategy_id`) adds its `reason` and `text`. */
const OWN_SENTENCES: Readonly<Record<string, readonly string[]>> = {
  prediction_reasons: ["reason"], lessons: ["lesson"], deviation_notes: ["text"], luck_test: ["method"], backtest_run: ["note", "eurusd"],
  strategy: ["verdict"],
};
const DECISION_SENTENCES = ["reason", "text"];

/** The payload with our own strategies' sentences in the dashboard's words; every other value as it was. Returns a
 *  new value. */
export function withPublicWords<T>(payload: T): T {
  const walk = (v: unknown, holder?: string): unknown => {
    if (Array.isArray(v)) return v.map((x) => walk(x, holder));
    if (!v || typeof v !== "object") return v;
    const o = v as Record<string, unknown>;
    const own = [...(holder && Object.hasOwn(OWN_SENTENCES, holder) ? OWN_SENTENCES[holder] : []), ...("strategy_id" in o ? DECISION_SENTENCES : [])];
    return Object.fromEntries(Object.entries(o).map(([k, x]) => [k, typeof x === "string" && own.includes(k) ? publicWords(x) : walk(x, k)]));
  };
  return walk(payload) as T;
}
