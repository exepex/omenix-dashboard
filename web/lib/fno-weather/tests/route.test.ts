// Story W3a: the market weather is India only: its navigation item is under Markets in India and absent in the US (the
// page itself answers 404 there, app/(cockpit)/[market]/weather/page.tsx), and its route names its mockup and endpoint.
import assert from "node:assert/strict";
import { test } from "node:test";
import { navGroups } from "../../shell/nav.ts";
import { pageByKey, pagePath } from "../../ui/routes.ts";

const items = (fno: boolean) => navGroups(fno).flatMap((g) => (g ? g.items.map((i) => [g.id, i.id] as const) : []));

test("the weather is in India's Markets group and absent in the US", () => {
  assert.ok(items(true).some(([g, i]) => g === "markets" && i === "weather"));
  assert.ok(!items(false).some(([, i]) => i === "weather"));
});

test("its route: /india/weather, mockup 40, endpoint fno/weather, story W3", () => {
  const page = pageByKey("weather");
  assert.deepEqual([pagePath("india", "weather"), page.mockup, page.endpoint, page.owner], ["/india/weather", "40-weather", "fno/weather", "W3"]);
});

test("the weather history: /india/weather/history, mockup 46, endpoint fno/weather-history, not in the navigation", () => {
  const page = pageByKey("weather-history");
  assert.deepEqual([pagePath("india", "weather-history"), page.mockup, page.endpoint, page.owner, page.nav], ["/india/weather/history", "46-weather-history", "fno/weather-history", "W3", false]);
  assert.ok(!items(true).some(([, i]) => i === "weather-history"));
});
