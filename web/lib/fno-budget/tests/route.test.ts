// Story W3g: the AI usage and budget is India only, in the Control group (story W3 answer (a)); absent in the US (the
// page answers 404 there, app/(cockpit)/[market]/budget/page.tsx).
import assert from "node:assert/strict";
import { test } from "node:test";
import { navGroups } from "../../shell/nav.ts";
import { pageByKey, pagePath } from "../../ui/routes.ts";

const items = (fno: boolean) => navGroups(fno).flatMap((g) => (g ? g.items.map((i) => [g.id, i.id] as const) : []));

test("the budget is in India's Control group and absent in the US", () => {
  assert.ok(items(true).some(([g, i]) => g === "control" && i === "budget"));
  assert.ok(!items(false).some(([, i]) => i === "budget"));
});

test("its route: /india/budget, mockup 43, endpoint fno/budget, story W3", () => {
  const page = pageByKey("budget");
  assert.deepEqual([pagePath("india", "budget"), page.mockup, page.endpoint, page.owner, page.nav], ["/india/budget", "43-budget", "fno/budget", "W3", true]);
});
