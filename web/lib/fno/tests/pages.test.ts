// Judge 63: the page each block is read from is the contract's (its examples' envelope page_key and its publisher),
// never either builder's memory. The F&O books are page `risk` and the picks `today` (W10's names; the orchestrator,
// 13 Oct 2026: the contract wins and exepex/trading renames its pages to them).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { FNO_PAGES } from "../pages.ts";

const repo = join(import.meta.dirname, "..", "..", "..", "..");
type Envelope = { value: { page_key: string; publisher: string; market: string } };
const examples: Record<string, Envelope> = Object.assign(
  {},
  ...["blocks.json", "blocks-33-34.json", "fno-screens.json"].map((f) => JSON.parse(readFileSync(join(repo, "api/examples", f), "utf8"))),
);

test("every block the dashboard reads from exepex/trading names the contract's page key", () => {
  for (const [block, page] of Object.entries(FNO_PAGES)) {
    const own = Object.entries(examples).filter(([name]) => name.split("_")[0] === block);
    assert.ok(own.length > 0, `${block} has a contract example`);
    for (const [name, e] of own) {
      assert.equal(e.value.page_key, page, `${name}: the contract's page_key`);
      assert.equal(e.value.publisher, "fno", `${name}: published by exepex/trading`);
      assert.equal(e.value.market, "india", `${name}: India only`);
    }
  }
  assert.equal(FNO_PAGES.getFnoBooks, "risk");
  assert.equal(FNO_PAGES.getFnoPicks, "today");
});

test("no exepex/trading block of the contract is missing from the dashboard's map (Home, frame, Markets and the F&O screens)", () => {
  const read = new Set(Object.keys(FNO_PAGES));
  const fnoBlocks = new Set(Object.entries(examples).filter(([, e]) => e.value.publisher === "fno").map(([name]) => name.split("_")[0]));
  // the F&O blocks the screens do not read yet (contract search, contract quote, order rules: the order window is not built;
  // P1's other screens: W3c to W3h; contract 2.8.0's scoreboards, budget and data health: W3g, W3h, W3e)
  const notRead = new Set(["searchFnoContracts", "getFnoContract", "getFnoOrderRules", "getFnoCard", "getFnoPaperTrades",
    "getFnoScoreboards", "getFnoBudget", "getFnoDataHealth"]);
  assert.deepEqual([...fnoBlocks].filter((b) => !read.has(b) && !notRead.has(b)), []);
});
