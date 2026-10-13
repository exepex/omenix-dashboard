// The rail: India-only screens absent in the US, every existing page reachable, the current group of a path.
import assert from "node:assert/strict";
import { test } from "node:test";
import { PAGES } from "../../ui/routes.ts";
import { allScreens, currentGroup, navGroups, pins, screenHref } from "../nav.ts";

test("the US rail has no India-only screen or pin", () => {
  const us = allScreens(false).map((s) => s.id);
  for (const id of ["chain", "builder", "forecasts"]) assert.ok(!us.includes(id), id);
  assert.ok(allScreens(true).some((s) => s.id === "chain"));
  assert.deepEqual(pins(false).map((p) => p.short), ["Rule vs AI"]);
  assert.ok(navGroups(false).every((g) => g === null || g.items.length > 0));
});

test("every navigable page of the app is a screen of the rail, with its own URL", () => {
  const linked = new Set(allScreens(true).map((s) => s.page).filter(Boolean));
  for (const p of PAGES.filter((x) => x.nav)) assert.ok(linked.has(p.key), p.key);
  const lab = allScreens(true).find((s) => s.page === "lab");
  assert.equal(lab && screenHref("us", lab), "/us/strategy-lab");
});

test("the current group of a path; the per-stock pages hang off Research; the gallery has none", () => {
  assert.equal(currentGroup("/india"), "dashboard");
  assert.equal(currentGroup("/us/strategy-lab"), "strategies");
  assert.equal(currentGroup("/india/paper-portfolios"), "portfolio");
  assert.equal(currentGroup("/india/stocks/RELIANCE"), "research");
  assert.equal(currentGroup("/india/stocks/RELIANCE/strategies"), "research");
  assert.equal(currentGroup("/india/gallery"), null);
});
