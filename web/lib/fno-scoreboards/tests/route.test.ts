// Story W3h: the F&O scoreboards are India only, in the Strategies group beside the stock tool's Rule vs AI scoreboard
// (its own page, never merged); absent in the US (app/(cockpit)/[market]/fno-scoreboards/page.tsx answers 404 there).
import assert from "node:assert/strict";
import { test } from "node:test";
import { navGroups } from "../../shell/nav.ts";
import { pageByKey, pagePath } from "../../ui/routes.ts";

const items = (fno: boolean) => navGroups(fno).flatMap((g) => (g ? g.items.map((i) => [g.id, i.id, i.page] as const) : []));

test("the F&O scoreboards are in India's Strategies group, apart from the stock scoreboard, and absent in the US", () => {
  assert.ok(items(true).some(([g, i]) => g === "strategies" && i === "fno-scoreboards"));
  assert.ok(items(true).some(([, i, page]) => i === "scoreboards" && page === "compare"), "the stock scoreboard keeps its own page");
  assert.ok(!items(false).some(([, i]) => i === "fno-scoreboards"));
});

test("its route: /india/fno-scoreboards, mockup 42, endpoint fno/scoreboards, story W3", () => {
  const page = pageByKey("fno-scoreboards");
  assert.deepEqual([pagePath("india", "fno-scoreboards"), page.mockup, page.endpoint, page.owner, page.nav], ["/india/fno-scoreboards", "42-scoreboards", "fno/scoreboards", "W3", true]);
});
