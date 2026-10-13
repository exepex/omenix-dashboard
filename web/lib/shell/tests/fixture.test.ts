// The fixture adapter is the signed-off mockup's data, unchanged, read through the ShellData interface.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fixtureShellData, fromMockup } from "../fixture-source.ts";

const mockup = JSON.parse(readFileSync(new URL("../../../../design/mockups/30-shell/data.json", import.meta.url), "utf8"));

test("the fixture adapter returns the mockup's records without its notes, labelled as example data", async () => {
  const p = await fixtureShellData.read();
  assert.equal(p.example, true);
  assert.equal("_note" in p, false);
  assert.deepEqual(p.markets, mockup.markets);
  assert.equal(p.now, mockup.now);
});

test("a payload not marked as a mockup is not example data", () => {
  assert.equal(fromMockup({ ...mockup, _mock: false }).example, false);
});
