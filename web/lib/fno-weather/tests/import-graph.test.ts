// Story W3a (the W12 pattern): the weather's components depend only on its contract types and views, never on an
// adapter, a wiring or a data client; its adapter is one line of lib/fno-weather/wiring.ts, read only by the page's
// loader. Uses the one import resolver of the W8 structure tests (alias, extensionless, re-exports, dynamic, transitive).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { importsOf, reachable, sources, web, type Source } from "../../shell/tests/imports.ts";

const appCode = (): Source[] => ["app", "components", "lib", "middleware.ts"].flatMap(sources).filter((f) => !/(^|\/)tests\//.test(f.path));
const WIRING = "lib/fno-weather/wiring";
const LOADER = "app/(cockpit)/[market]/weather/_parts/weather-page.tsx";
const FORBIDDEN = [/^lib\/fno-weather\/(fixture-source|azure-source|wiring)$/, /^lib\/fixtures\//, /^lib\/fno\//, /^lib\/(shell|home|screener|overview)\/(wiring|fixture-source|azure-source)$/, /^lib\/data\/(?!constants$)/, /^lib\/tools\//, /^pg$/, /^next\/server$/];
const PICK = /^export const weatherData: WeatherData = fnoReader \? azureWeatherData\(fnoReader\) : lazyAdapter\(\(\) => import\("\.\/fixture-source\.ts"\)\.then\(\(m\) => m\.fixtureWeatherData\)\);$/gm;

const forbiddenReach = (start: Source[], all: Source[]) => [...reachable(start, all)].filter((m) => FORBIDDEN.some((re) => re.test(m))).sort();
const readersOf = (files: Source[]) => files.filter((f) => importsOf(f).includes(WIRING)).map((f) => f.path);
const components = sources("components/fno-weather");

test("the weather's components reach no adapter, wiring or data client, directly or transitively", () => {
  assert.ok(components.length >= 3);
  assert.ok(reachable(components, appCode()).has("lib/fno-weather/view"), "the walk follows the components' own imports");
  assert.deepEqual(forbiddenReach(components, appCode()), []);
});

test("only the page's loader reads the weather's wiring; one line picks the adapter", () => {
  assert.deepEqual(readersOf(appCode()), [LOADER]);
  assert.equal([...readFileSync(join(web, "lib/fno-weather/wiring.ts"), "utf8").matchAll(PICK)].length, 1);
});

test("the checks catch planted breaches: an adapter, the wiring, a data client", () => {
  const real = appCode();
  const comp = (line: string): Source => ({ path: "components/fno-weather/planted.tsx", text: `${line}\nexport const x = 1;\n` });
  for (const line of ['import { fixtureWeatherData } from "@/lib/fno-weather/fixture-source";', 'import { weatherData } from "../../lib/fno-weather/wiring";', 'import { fnoQuery } from "@/lib/fno/db";']) {
    assert.equal(forbiddenReach([comp(line)], [...real, comp(line)]).length >= 1, true, line);
  }
  assert.ok(readersOf([...real, comp('import { weatherData } from "@/lib/fno-weather/wiring";')]).includes("components/fno-weather/planted.tsx"));
});
