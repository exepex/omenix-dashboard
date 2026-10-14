// The backend's sentences in the dashboard's words (owner, 13 Oct 2026: no screen says how a strategy decides, and the
// cockpit says "market mood" for the market regime it shows). A backend writes free text (an AI trader's reason, a
// luck test's method, a back-test note) in its own vocabulary: "regime" there is the market mood, "bars" the stored
// daily prices. Only sentences change (a value with a space); codes and keys ("strategy_regime", "rm.bars") stay as
// the contract has them. A sentence that still names how a strategy decides after that (a lone "bar" or a threshold,
// a number tied to a rule: lib/ui/internal-words.ts) cannot be reworded into a public one, so it is withheld whole
// and the reader sees that it was. Pure.
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

/** The payload with every sentence in the dashboard's words. Returns a new value. */
export function withPublicWords<T>(payload: T): T {
  const walk = (v: unknown): unknown =>
    typeof v === "string" ? publicWords(v)
      : Array.isArray(v) ? v.map(walk)
        : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v;
  return walk(payload) as T;
}
