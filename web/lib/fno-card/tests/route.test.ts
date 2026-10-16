// Story W3f: today's card is India only, in the Strategies group (story W3 answer (a)); absent in the US (the page
// answers 404 there, app/(cockpit)/[market]/card/page.tsx).
import assert from "node:assert/strict";
import { test } from "node:test";
import { navGroups } from "../../shell/nav.ts";
import { pageByKey, pagePath } from "../../ui/routes.ts";

const items = (fno: boolean) => navGroups(fno).flatMap((g) => (g ? g.items.map((i) => [g.id, i.id] as const) : []));

test("today's card is in India's Strategies group and absent in the US", () => {
  assert.ok(items(true).some(([g, i]) => g === "strategies" && i === "card"));
  assert.ok(!items(false).some(([, i]) => i === "card"));
});

test("its route: /india/card, mockup 39, endpoint fno/card, story W3", () => {
  const page = pageByKey("card");
  assert.deepEqual([pagePath("india", "card"), page.mockup, page.endpoint, page.owner, page.nav], ["/india/card", "39-trade-card", "fno/card", "W3", true]);
});
