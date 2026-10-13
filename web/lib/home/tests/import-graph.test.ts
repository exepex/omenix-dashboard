// Story W9 criterion 3: Home's components depend only on the HomeData contract types (and the frame's), never on an
// adapter or a data client; the adapter is one line of lib/home/wiring.ts, read only by Home's block loaders. Uses the
// one import resolver of the W8 structure tests (alias, extensionless, re-exports, dynamic, transitive).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { canonical, importsOf, reachable, sources, web, type Source } from "../../shell/tests/imports.ts";

const appCode = (): Source[] => ["app", "components", "lib", "middleware.ts"].flatMap(sources).filter((f) => !/(^|\/)tests\//.test(f.path));
const ADAPTER = /^lib\/home\/(fixture-source$|fixture\/)|^lib\/fixtures\//;
const WIRING = "lib/home/wiring";
const LOADERS = "app/(cockpit)/[market]/_home/blocks.tsx";
const FORBIDDEN = [ADAPTER, /^lib\/home\/wiring$/, /^lib\/shell\/(fixture-source$|fixture\/|wiring$)/, /^lib\/data\/(?!constants$)/, /^lib\/tools\//, /^lib\/assistant\//, /^lib\/ui\/(api-client|use-api)$/, /^pg$/, /^@anthropic-ai\//, /^next\/server$/];

export const adapterImports = (files: Source[]) =>
  files.filter((f) => ![WIRING, "lib/home/fixture-source", "lib/overview/fixture-source", "lib/screener/fixture-source", "lib/fixtures/examples"].includes(canonical(f.path))).flatMap((f) => importsOf(f).filter((m) => ADAPTER.test(m)).map((m) => `${f.path} imports ${m}`));
export const wiringReaders = (files: Source[]) => files.filter((f) => importsOf(f).includes(WIRING)).map((f) => f.path);
export const forbiddenReach = (start: Source[], all: Source[]) => [...reachable(start, all)].filter((m) => FORBIDDEN.some((re) => re.test(m))).sort();

const homeComponents = sources("components/home");

test("Home's components reach no adapter, wiring or data client, directly or transitively", () => {
  assert.ok(homeComponents.length >= 6);
  assert.ok(reachable(homeComponents, appCode()).has("lib/home/groups"), "the walk follows Home's own imports");
  assert.deepEqual(forbiddenReach(homeComponents, appCode()), []);
});

test("no module but the wiring imports Home's adapter; only Home's block loaders read the wiring; one line picks it", () => {
  assert.deepEqual(adapterImports(appCode()), []);
  assert.deepEqual(wiringReaders(appCode()), [LOADERS]);
  assert.equal([...readFileSync(join(web, "lib/home/wiring.ts"), "utf8").matchAll(/^export const homeData: HomeData = (\w+);$/gm)].length, 1);
});

test("the checks catch planted breaches: alias, extensionless, re-export through a helper, a data client", () => {
  const real = appCode();
  const comp = (line: string): Source => ({ path: "components/home/planted.tsx", text: `${line}\nexport const x = 1;\n` });
  for (const line of ['import { fixtureHomeData } from "@/lib/home/fixture-source";', 'import { fixtureHomeData } from "../../lib/home/fixture-source";', "const m = await import(`@/lib/home/fixture-source`);"]) {
    assert.equal(adapterImports([...real, comp(line)]).length, 1, line);
    assert.ok(forbiddenReach([comp(line)], [...real, comp(line)]).includes("lib/home/fixture-source"), line);
  }
  const helper: Source = { path: "lib/home/helpers-x.ts", text: 'export { fixtureHomeData } from "./fixture-source";\n' };
  const user = comp('import { fixtureHomeData } from "@/lib/home/helpers-x";');
  assert.deepEqual(adapterImports([...real, helper, user]), ["lib/home/helpers-x.ts imports lib/home/fixture-source"]);
  assert.ok(forbiddenReach([user], [...real, helper, user]).includes("lib/home/fixture-source"));
  const wired = comp('import { homeData } from "@/lib/home/wiring";');
  assert.deepEqual(wiringReaders([...real, wired]).sort(), [LOADERS, "components/home/planted.tsx"].sort());
  const client = comp('import { readMarketPage } from "@/lib/data/handler";');
  assert.ok(forbiddenReach([client], [...real, client]).includes("lib/data/handler"));
});

test("Home draws no Buy or Sell of its own: every one is the frame's TradeButton, under the one lock rule", () => {
  for (const f of homeComponents) assert.doesNotMatch(f.text, /md-btn small (buy|sell)|["'`]mb-bs (buy|sell)|data-trade=/, f.path);
  assert.ok(homeComponents.some((f) => /import \{ (TradeButton|TradePair) \} from "\.\.\/frame\/trade\.tsx";/.test(f.text)));
});
