// Judge 234: the card has no fixed send time (trading T-cards.md: "T2 never assumes a time"; E8: the card posts after
// quotes_done, 15:15 or later), so the screen's own words never name one; the payload's three times carry it. A pure
// check over the card screen's code, proven to catch a planted break.
import assert from "node:assert/strict";
import { test } from "node:test";
import { sources, type Source } from "../../shell/tests/imports.ts";

const SCREEN = ["lib/fno-card", "components/fno-card", "app/(cockpit)/[market]/card"];
const screenCode = (): Source[] => SCREEN.flatMap(sources).filter((f) => !/(^|\/)tests\//.test(f.path));

/** Every place the screen's words give the card a clock time of its own ("at about 15:08", "at 15:15 IST"). */
export const fixedTimes = (files: Source[]) =>
  files.flatMap((f) => [...f.text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").matchAll(/\b(?:at|by|around|about)\s+(?:about\s+)?\d{1,2}:\d{2}\b/gi)].map((m) => `${f.path}: ${m[0]}`));

test("the card screen's words name no fixed card time", () => {
  assert.ok(screenCode().length >= 8, "the scan covers the screen's files");
  assert.deepEqual(fixedTimes(screenCode()), []);
});

test("a planted fixed time is caught", () => {
  const plant: Source = { path: "app/(cockpit)/[market]/card/_parts/plant.tsx", text: 'const LEDE = "Every trading day at about 15:08 the desk sends one card";' };
  assert.deepEqual(fixedTimes([plant]), ["app/(cockpit)/[market]/card/_parts/plant.tsx: at about 15:08"]);
});
