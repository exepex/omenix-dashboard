// Story W3a, owner 16 Oct 2026: the weather screen shows the colour, the input values and the reason, never the level
// at which an input or a chance turns a colour. Checked against M1's own configured levels (./m1-levels.ts), not bare
// numbers, in two places: the screen's own code (no level as a number, a "N%" or a "N times") and everything its
// views say for the good, bad and empty examples (no threshold wording, no per-input `reaches`). Each rule is a pure
// check, proven to catch a planted break.
import assert from "node:assert/strict";
import { test } from "node:test";
import { sources, type Source } from "../../shell/tests/imports.ts";
import { WEATHER_EXAMPLES, weatherExample } from "../fixture-source.ts";
import { priceOf, recentOf, redShareOf, scoresOf } from "../record-view.ts";
import { chancesOf, driversOf, upgradesOf, verdictOf } from "../view.ts";
import { ALL_LEVELS, QUESTION_SIZE } from "./m1-levels.ts";

const SCREEN = ["lib/fno-weather", "components/fno-weather", "app/(cockpit)/[market]/weather"];
const screenCode = (): Source[] => SCREEN.flatMap(sources).filter((f) => !/(^|\/)tests\//.test(f.path));

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const isLevel = (x: number) => ALL_LEVELS.some((l) => near(x, l));
const withoutComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

/** Every level the screen's code names: a numeric literal equal to a level, "N%" with N/100 a level (the question's own
 *  "2% move" aside: it names the event, not a level) or "N times" / "Nx" with N a multiple. */
export function levelsInCode(files: Source[]): string[] {
  const found: string[] = [];
  for (const f of files) {
    const code = withoutComments(f.text).replace(/^import .*$/gm, "");
    for (const m of code.matchAll(/(\d+(?:\.\d+)?)\s*%(?!\s*move)/g)) if (isLevel(Number(m[1]) / 100) && !near(Number(m[1]) / 100, QUESTION_SIZE)) found.push(`${f.path}: ${m[0]}`);
    for (const m of code.matchAll(/(?<![\w.$])(\d*\.\d+|\d+)(?![\w%])/g)) if (isLevel(Number(m[1]))) found.push(`${f.path}: ${m[1]}`);
  }
  return found;
}

const WORDING = [/\b(turns?|goes|becomes|is)\s+(RED|AMBER|GREEN)\s+(at|when|if|above|from|once)\b/i, /\b(RED|AMBER|GREEN)\s+(at|when|if|above|from)\s+\d/i, /\bfloors?\b/i, /\bthresholds?\b/i, /\breach(es)?\b/i, /\bcut-?off\b/i];

/** Every sentence of the screen's words that names a threshold, or a `reaches` field in what the views carry. */
export function thresholdWords(texts: string[]): string[] {
  return texts.filter((t) => WORDING.some((re) => re.test(t)) || /"reaches"/.test(t));
}

/** Everything the views say about one weather, as the screen draws it. */
const viewsOf = (name: (typeof WEATHER_EXAMPLES)[number]) => {
  const w = weatherExample(name);
  return [verdictOf(w), chancesOf(w), driversOf(w), upgradesOf(w), recentOf(w), redShareOf(w), scoresOf(w), priceOf(w)];
};
const allSaid = () => WEATHER_EXAMPLES.flatMap((n) => viewsOf(n).map((v) => JSON.stringify(v)));

test("the screen's code names none of M1's levels (as a number, a percent or a multiple)", () => {
  assert.ok(screenCode().length >= 8, "the scan covers the screen's files");
  assert.deepEqual(levelsInCode(screenCode()), []);
});

test("what the screen says for every example names no threshold and carries no per-input `reaches`", () => {
  assert.deepEqual(thresholdWords(allSaid()), []);
  for (const name of WEATHER_EXAMPLES) assert.ok(!JSON.stringify(weatherExample(name)).includes("reaches"), `${name}: the contract carries no reaches`);
});

test("planted breaks are caught: a level in the code, threshold wording, a reaches field", () => {
  const plant = (text: string): Source[] => [...screenCode(), { path: "lib/fno-weather/plant.ts", text }];
  assert.deepEqual(levelsInCode(plant('const RED_FLOOR = 0.35;')), ["lib/fno-weather/plant.ts: 0.35"]);
  assert.deepEqual(levelsInCode(plant('const help = "AMBER from 6% next session";')), ["lib/fno-weather/plant.ts: 6%"]);
  assert.ok(levelsInCode(plant("const k = 2.5;")).length === 1, "a multiple");
  assert.deepEqual(levelsInCode(plant('const q = "A 2% move next session";')), [], "the question's own 2% move is not a level");
  assert.equal(thresholdWords(["It turns RED at 10% next session"]).length, 1);
  assert.equal(thresholdWords(["RED when 2.5 times the usual chance"]).length, 1);
  assert.equal(thresholdWords(['{"driver":"vix_level","reaches":"RED"}']).length, 1);
  assert.equal(thresholdWords(["The RED floor is fixed"]).length, 1);
});
