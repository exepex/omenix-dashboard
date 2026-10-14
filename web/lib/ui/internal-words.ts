// The words that tell how a strategy decides (owner, 13 Oct 2026: screens and APIs show what a strategy decided, never
// how): its bar or threshold (the chance it buys at), the market regime its rule reads, and any number tied to such a
// rule ("buys at 55%", "its bar: 55%"). The dashboard says "market mood" for the regime it shows and draws no "bar"
// in words (a chart's bar is a line, a column or a strip). One list for the two scans that hold the rule: every /api/v1
// answer through the public view (lib/strategy-pages/tests/public-view.test.ts) and every screen's text and tooltips
// (tests/ui/cases/w14-internals.mjs). Pure.

const PCT = String.raw`\d+(?:\.\d+)?\s?%`;
/** A strategy's chance of a rise, in any of its names. */
const CHANCE = String.raw`(?:\b(?:chance|probability|score)\b|P\(up\))`;
const RULE_WORDS: ReadonlyArray<readonly [string, RegExp]> = [
  ["bar", /\bbars?\b/i],
  ["threshold", /thresholds?/i],
  ["regime", /regimes?/i],
  ["a number tied to a rule", new RegExp([
    String.raw`${CHANCE}[^.;:]{0,30}?(?:at least|at or above|or more|clears?|cleared|above|over|≥|>=)\s*(?:${PCT}|0?\.\d+\b)`,
    String.raw`${CHANCE}[^.;:]{0,30}?${PCT}\s*(?:or more|or higher|and above)`,
    String.raw`${PCT}\s*(?:or more|or higher|and above)[^.;]{0,20}${CHANCE}`,
    String.raw`\bbuys?\b[^.;]{0,30}?(?:at|from|over|above)\s+${PCT}`,
  ].join("|"), "i")],
];

/** A code of the contract ("strategy_regime", "rm.bars", "design/catalogue/bar.json"): never read as a word (a number such as 0.55 is not a code). */
const CODE = /(?<![\w.])(?=[\w./-]*[A-Za-z])[\w-]+(?:[._/][\w-]+)+/g;

/** Each internal word or rule-tied number the text shows, as "<kind>: <the match>". */
export function internalWordsIn(text: string): string[] {
  const words = text.replace(CODE, " ");
  return RULE_WORDS.flatMap(([kind, re]) => {
    const m = words.match(re);
    return m ? [`${kind}: "${m[0]}"`] : [];
  });
}
