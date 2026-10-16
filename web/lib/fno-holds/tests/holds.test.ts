// Contract 2.13.0 (judge 251 on P11): a held F&O page says so on its own screen. The words come from P1's examples
// (none, held); the structure rule checks that every F&O screen's loader except the card's wraps its page in the one
// HeldBlock with its own page key, so no screen can forget the notice.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import raw from "../../fixtures/fno-screens.generated.json" with { type: "json" };
import { exampleReader } from "../../fixtures/examples.ts";
import { web } from "../../shell/tests/imports.ts";
import { PAGES } from "../../ui/routes.ts";
import { holdOf, holdRowsOf, type FnoPageHolds } from "../holds.ts";

const read = exampleReader(raw, { strategies: false });
const held = read<FnoPageHolds>("getFnoPageHolds_india_held");
const none = read<FnoPageHolds>("getFnoPageHolds_india_none");

test("a page held with its previous page: the notice above it, dated, with the rule", () => {
  assert.deepEqual(holdOf(held, "forecast_lab"), { words: "Forecast lab held back since 12 Nov 2026: A forecast's answer day falls in a year whose NSE calendar is not published yet", nothing: false });
});

test("a page held with nothing: the notice and not published", () => {
  assert.deepEqual(holdOf(held, "paper_trades"), { words: "Paper books held back since 16 Nov 2026: An open trade has no marks for the session yet", nothing: true });
});

test("no hold, or holds unknown: no notice is invented", () => {
  assert.equal(holdOf(none, "forecast_lab"), null);
  assert.equal(holdOf(held, "weather"), null);
  assert.equal(holdOf(null, "forecast_lab"), null);
});

test("data health's table lists every hold, oldest first as sent", () => {
  assert.deepEqual(holdRowsOf(held).map((r) => [r.page, r.since, r.shows]), [
    ["Forecast lab", "12 Nov 2026", "Its last published page, dated, under a held-back notice"],
    ["Paper books", "16 Nov 2026", "Not published, with the notice"],
    ["Today's card", "16 Nov 2026", "Its last published page, dated, under a held-back notice"],
  ]);
  assert.deepEqual(holdRowsOf(none), []);
});

/** Each F&O screen's page key, by its route key; the card keeps its own `withheld` notice instead. */
const PAGE_KEY: Record<string, string> = {
  weather: "weather", "weather-history": "weather_history", forecasts: "forecast_lab", "paper-books": "paper_trades",
  "lab-fno": "strategy_lab", "data-health": "data_health", budget: "budget", "fno-scoreboards": "scoreboards",
};

/** The screen's page loader: the one `*-page.tsx` in its route's `_parts` folder. */
function loaderOf(segment: string): string {
  const dir = join(web, "app/(cockpit)/[market]", segment, "_parts");
  const file = readdirSync(dir).find((f) => f.endsWith("-page.tsx"));
  assert.ok(file, `${segment}: a page loader in _parts`);
  return readFileSync(join(dir, file), "utf8");
}

test("every F&O screen except the card wraps its page in HeldBlock with its own page key", () => {
  const screens = PAGES.filter((p) => p.owner === "W3");
  for (const page of screens) {
    const code = loaderOf(page.segment);
    if (page.key === "card") {
      assert.ok(!code.includes("HeldBlock"), "the card shows only its own withheld notice");
      continue;
    }
    assert.ok(PAGE_KEY[page.key], `${page.key}: a W3 screen without a known page key`);
    assert.ok(code.includes(`<HeldBlock pageKey="${PAGE_KEY[page.key]}">`), `${page.key} wraps its page in HeldBlock`);
  }
});
