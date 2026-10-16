// Story W3e: the F&O data health is the Control group's existing "Data health" item, India only: absent in the US (the
// page answers 404 there, app/(cockpit)/[market]/data-health/page.tsx); the stock side's data health comes later.
import assert from "node:assert/strict";
import { test } from "node:test";
import { navGroups } from "../../shell/nav.ts";
import { pageByKey, pagePath } from "../../ui/routes.ts";

const items = (fno: boolean) => navGroups(fno).flatMap((g) => (g ? g.items.map((i) => [g.id, i.id, i.page] as const) : []));

test("Data health opens the F&O page in India's Control group and is absent in the US", () => {
  assert.ok(items(true).some(([g, i, page]) => g === "control" && i === "health" && page === "data-health"));
  assert.ok(!items(false).some(([, i]) => i === "health"));
});

test("its route: /india/data-health, mockup 44, endpoint fno/data-health, story W3", () => {
  const page = pageByKey("data-health");
  assert.deepEqual([pagePath("india", "data-health"), page.mockup, page.endpoint, page.owner, page.nav], ["/india/data-health", "44-data-health", "fno/data-health", "W3", true]);
});
