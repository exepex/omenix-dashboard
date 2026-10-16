// Story W3 (the W12 pattern, every F&O screen): each screen's components depend only on its contract types and views,
// never on an adapter, a wiring or a data client; its adapter is one line of lib/fno-<screen>/wiring.ts, read only by
// the screen's page loader under one W3 route. The screens are found from their wirings, so a new one is checked
// without editing this file. Uses the one import resolver of the W8 structure tests.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { PAGES } from "../../ui/routes.ts";
import { importsOf, reachable, sources, web, type Source } from "../../shell/tests/imports.ts";

const appCode = (): Source[] => ["app", "components", "lib", "middleware.ts"].flatMap(sources).filter((f) => !/(^|\/)tests\//.test(f.path));
const SCREENS = readdirSync(join(web, "lib")).filter((d) => /^fno-[a-z-]+$/.test(d) && sources(`lib/${d}/wiring.ts`).length);
const LOADERS = PAGES.filter((p) => p.owner === "W3").map((p) => `app/(cockpit)/[market]/${p.segment}/_parts/`);
const FORBIDDEN = [/^lib\/fno-[a-z-]+\/(fixture-source|azure-source|wiring)$/, /^lib\/fixtures\//, /^lib\/fno\//, /^lib\/(shell|home|screener|overview)\/(wiring|fixture-source|azure-source)$/, /^lib\/data\/(?!constants$)/, /^lib\/tools\//, /^pg$/, /^next\/server$/];
const PICK = () => new RegExp(`^export const \\w+: \\w+ = fnoReader \\? azure\\w+\\(fnoReader\\) : lazyAdapter\\(\\(\\) => import\\("\\./fixture-source\\.ts"\\)\\.then\\(\\(m\\) => m\\.fixture\\w+\\)\\);$`, "gm");

const forbiddenReach = (start: Source[], all: Source[]) => [...reachable(start, all)].filter((m) => FORBIDDEN.some((re) => re.test(m))).sort();
const readersOf = (files: Source[], wiring: string) => files.filter((f) => importsOf(f).includes(wiring)).map((f) => f.path);

test("the F&O screens are found: the weather and the Forecast lab at least", () => {
  assert.ok(SCREENS.includes("fno-weather") && SCREENS.includes("fno-forecast-lab"), SCREENS.join(", "));
});

for (const screen of SCREENS) {
  test(`${screen}: its components reach no adapter, wiring or data client, directly or transitively`, () => {
    const components = sources(`components/${screen}`);
    assert.ok(components.length >= 2, `components/${screen} exists`);
    assert.ok(reachable(components, appCode()).has(`lib/${screen}/contract`), "the walk follows the components' own imports");
    assert.deepEqual(forbiddenReach(components, appCode()), []);
  });

  test(`${screen}: only its page loader reads its wiring; one line picks the adapter`, () => {
    const readers = readersOf(appCode(), `lib/${screen}/wiring`);
    assert.equal(readers.length, 1, readers.join(", "));
    assert.ok(LOADERS.some((dir) => readers[0].startsWith(dir)), `${readers[0]} is a W3 page loader`);
    assert.equal([...readFileSync(join(web, `lib/${screen}/wiring.ts`), "utf8").matchAll(PICK())].length, 1);
  });
}

test("the checks catch planted breaches: an adapter, the wiring, a data client", () => {
  const real = appCode();
  const comp = (line: string): Source => ({ path: "components/fno-weather/planted.tsx", text: `${line}\nexport const x = 1;\n` });
  for (const line of ['import { fixtureWeatherData } from "@/lib/fno-weather/fixture-source";', 'import { forecastLabData } from "../../lib/fno-forecast-lab/wiring";', 'import { fnoQuery } from "@/lib/fno/db";']) {
    assert.ok(forbiddenReach([comp(line)], [...real, comp(line)]).length >= 1, line);
  }
  assert.equal(readersOf([...real, comp('import { weatherData } from "@/lib/fno-weather/wiring";')], "lib/fno-weather/wiring").length, 2);
});
