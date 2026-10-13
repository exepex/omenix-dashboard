// Story W12 criterion 2: the Screener's and the Markets overview's components depend only on the W11 typed block
// contracts (and the frame's), never on an adapter or a data client; each adapter is one line of its wiring file, read
// only by that page's block loaders (W2: the line picks the database adapter or, lazily, the fixtures). Uses the one import resolver of the W8 structure tests (alias, extensionless,
// re-exports, dynamic, transitive).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { canonical, computedImports, importsOf, reachable, sources, web, type Source } from "../../shell/tests/imports.ts";

const appCode = (): Source[] => ["app", "components", "lib", "middleware.ts"].flatMap(sources).filter((f) => !/(^|\/)tests\//.test(f.path));
const ADAPTERS = /^lib\/(screener|overview|home)\/(fixture-source$|azure-source$|fixture\/)|^lib\/fixtures\//;
const WIRINGS = { screener: "lib/screener/wiring", overview: "lib/overview/wiring", fno: "lib/fno/wiring" };
const FRESHNESS = "app/(cockpit)/[market]/_fno/freshness-block.tsx";
const PICK = (name: string, type: string) => new RegExp(`^export const ${name}: ${type} = fnoReader \\? \\w+\\(fnoReader\\) : lazyAdapter\\(\\(\\) => import\\("\\./fixture-source\\.ts"\\)\\.then\\(\\(m\\) => m\\.\\w+\\)\\);$`, "gm");
const LOADERS = { screener: "app/(cockpit)/[market]/screener/_parts/blocks.tsx", markets: "app/(cockpit)/[market]/markets/_parts/blocks.tsx" };
const FORBIDDEN = [ADAPTERS, /^lib\/(screener|overview|home|shell|fno)\/wiring$/, /^lib\/fno\//, /^lib\/shell\/(fixture-source$|fixture\/)/, /^lib\/data\/(?!constants$)/, /^lib\/tools\//, /^lib\/assistant\//, /^lib\/ui\/(api-client|use-api)$/, /^pg$/, /^@anthropic-ai\//, /^next\/server$/];
/** The modules allowed to import an adapter: the wirings, and the adapters' own shared reader. */
const MAY_IMPORT_ADAPTERS = [WIRINGS.screener, WIRINGS.overview, "lib/home/wiring", "lib/screener/fixture-source", "lib/overview/fixture-source", "lib/home/fixture-source", "lib/shell/wiring", "lib/shell/fixture-source", "lib/fixtures/examples"];

const adapterImports = (files: Source[]) => files.filter((f) => !MAY_IMPORT_ADAPTERS.includes(canonical(f.path))).flatMap((f) => importsOf(f).filter((m) => ADAPTERS.test(m)).map((m) => `${f.path} imports ${m}`));
const readersOf = (files: Source[], wiring: string) => files.filter((f) => importsOf(f).includes(wiring)).map((f) => f.path).sort();
const forbiddenReach = (start: Source[], all: Source[]) => [...reachable(start, all)].filter((m) => FORBIDDEN.some((re) => re.test(m))).sort();

const components = [...sources("components/screener"), ...sources("components/markets")];

test("the Screener's and Markets' components reach no adapter, wiring or data client, directly or transitively", () => {
  assert.ok(components.length >= 14);
  const seen = reachable(components, appCode());
  assert.ok(seen.has("lib/screener/screens") && seen.has("lib/overview/view"), "the walk follows the pages' own imports");
  assert.deepEqual(forbiddenReach(components, appCode()), []);
});

test("no module but a wiring imports an adapter; only each page's loaders read its wiring; one line picks each", () => {
  assert.deepEqual(adapterImports(appCode()), []);
  assert.deepEqual(readersOf(appCode(), WIRINGS.screener), [LOADERS.markets, LOADERS.screener].sort());
  assert.deepEqual(readersOf(appCode(), WIRINGS.overview), [LOADERS.markets]);
  assert.deepEqual(readersOf(appCode(), WIRINGS.fno), [FRESHNESS, "lib/home/wiring.ts", "lib/shell/wiring.ts", WIRINGS.screener + ".ts", WIRINGS.overview + ".ts"].sort());
  assert.equal([...readFileSync(join(web, "lib/screener/wiring.ts"), "utf8").matchAll(PICK("screenerData", "ScreenerData"))].length, 1);
  assert.equal([...readFileSync(join(web, "lib/overview/wiring.ts"), "utf8").matchAll(PICK("overviewData", "OverviewData"))].length, 1);
});

test("the checks catch planted breaches: alias, extensionless, dynamic, re-export through a helper, a data client", () => {
  const real = appCode();
  const comp = (line: string): Source => ({ path: "components/screener/planted.tsx", text: `${line}\nexport const x = 1;\n` });
  for (const line of ['import { fixtureScreenerData } from "@/lib/screener/fixture-source";', 'import { fixtureOverviewData } from "../../lib/overview/fixture-source";', "const m = await import(`@/lib/screener/fixture-source`);"]) {
    assert.equal(adapterImports([...real, comp(line)]).length, 1, line);
    assert.ok(forbiddenReach([comp(line)], [...real, comp(line)]).some((m) => /fixture-source$/.test(m)), line);
  }
  const helper: Source = { path: "lib/screener/helpers-x.ts", text: 'export { fixtureScreenerData } from "./fixture-source";\n' };
  const user = comp('import { fixtureScreenerData } from "@/lib/screener/helpers-x";');
  assert.deepEqual(adapterImports([...real, helper, user]), ["lib/screener/helpers-x.ts imports lib/screener/fixture-source"]);
  const wired = comp('import { screenerData } from "@/lib/screener/wiring";');
  assert.ok(readersOf([...real, wired], WIRINGS.screener).includes("components/screener/planted.tsx"));
  assert.ok(forbiddenReach([wired], [...real, wired]).includes("lib/screener/wiring"));
  const client = comp('import { readMarketPage } from "@/lib/data/handler";');
  assert.ok(forbiddenReach([client], [...real, client]).includes("lib/data/handler"));
});

// Judge 45, minor 2: a computed import names no module the walk could follow, so it is refused outright.
test("the pages' components and loaders make no computed import (one the walk could not follow)", () => {
  const pages = [...components, ...sources("app/(cockpit)/[market]/screener"), ...sources("app/(cockpit)/[market]/markets")];
  assert.deepEqual(pages.filter(computedImports).map((f) => f.path), []);
  const planted: Source = { path: "components/markets/planted.tsx", text: 'const m = "../../lib/overview/" + "wiring";\nconst w = await import(m);\nexport const x = w;\n' };
  assert.equal(computedImports(planted), true, "a computed import(m) of the overview wiring is caught");
});

test("the pages draw no Buy or Sell of their own: every one comes from the frame's trade.tsx, under the one lock rule", () => {
  for (const f of components) assert.doesNotMatch(f.text, /md-btn small (buy|sell)|["'`]mb-bs (buy|sell)|mb-bs \$\{side\}|data-trade=/, f.path);
  assert.ok(components.some((f) => /import \{ TradePair, TradeUnavailable \} from "\.\.\/frame\/trade\.tsx";/.test(f.text)));
});
