// Story W3c: the paper books are India only: their navigation item is in India's Portfolio group and absent in the US
// (the page itself answers 404 there, app/(cockpit)/[market]/paper-books/page.tsx), and the route names its mockup.
import assert from "node:assert/strict";
import { test } from "node:test";
import { navGroups } from "../../shell/nav.ts";
import { pageByKey, pagePath } from "../../ui/routes.ts";

const items = (fno: boolean) => navGroups(fno).flatMap((g) => (g ? g.items.map((i) => [g.id, i.id] as const) : []));

test("the paper books are in India's Portfolio group and absent in the US", () => {
  assert.ok(items(true).some(([g, i]) => g === "portfolio" && i === "paper-books"));
  assert.ok(!items(false).some(([, i]) => i === "paper-books"));
});

test("its route: /india/paper-books, mockup 41, endpoint fno/paper-books, story W3", () => {
  const page = pageByKey("paper-books");
  assert.deepEqual([pagePath("india", "paper-books"), page.mockup, page.endpoint, page.owner, page.nav], ["/india/paper-books", "41-paper-books", "fno/paper-books", "W3", true]);
});
