// The fixture adapter is the signed-off mockup's data read through the ShellData interface, unchanged but for the strategy
// naming rule (public labels and ids, lib/ui/strategy-names.ts).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fixtureShellData, fromMockup } from "../fixture-source.ts";
import { applyDisplayNames } from "../../ui/strategy-names.ts";

const mockup = JSON.parse(readFileSync(new URL("../../../../design/mockups/30-shell/data.json", import.meta.url), "utf8"));

test("the fixture adapter returns the mockup's records without its notes, labelled as example data", async () => {
  const p = await fixtureShellData.read();
  assert.equal(p.example, true);
  assert.equal("_note" in p, false);
  assert.deepEqual(p.markets, applyDisplayNames(mockup.markets), "the mockup's records, with strategies named by their public labels");
  assert.equal(p.now, mockup.now);
});

test("a payload not marked as a mockup is not example data", () => {
  assert.equal(fromMockup({ ...mockup, _mock: false }).example, false);
});
