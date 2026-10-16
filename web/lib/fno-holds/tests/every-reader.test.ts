// Judge 256: every reader of a page the publication can hold says so on its own screen, not only the W3 screens. Home's
// picks (page `today`, through the frame) and books (page `risk`) get the same notice; every page key is put in one
// closed list of how its hold is shown, and each module that reads a held page's endpoint must be one whose notice
// this test checks, so a new reader cannot forget it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import raw from "../../fixtures/fno-screens.generated.json" with { type: "json" };
import { exampleReader } from "../../fixtures/examples.ts";
import type { FnoBlockReader, FnoPageKey } from "../../fno/blocks.ts";
import { nseCalendar } from "../../fno/calendar.ts";
import { FnoUnavailable } from "../../fno/db.ts";
import { FNO_PAGES, type FnoBlockName } from "../../fno/pages.ts";
import { BlockEmpty } from "../../ui/block-states.ts";
import { fnoHomeData } from "../../home/azure-source.ts";
import { fixtureHomeData } from "../../home/fixture-source.ts";
import { fnoShellData } from "../../shell/azure-source.ts";
import { fixtureShellData } from "../../shell/fixture-source.ts";
import { sources, web } from "../../shell/tests/imports.ts";
import { holdOf, type FnoPageHolds } from "../holds.ts";

const read = exampleReader(raw, { strategies: false });
const held = read<FnoPageHolds>("getFnoPageHolds_india_held");
const none = read<FnoPageHolds>("getFnoPageHolds_india_none");
const NOW = () => new Date("2026-11-16T05:00:00Z");

/** The holds page as given; every other page not published (each part then carries its reason). */
function reader(holds: FnoPageHolds | Error): FnoBlockReader {
  const envelope = <T>(payload: unknown) => ({ payload: payload as T, publication_id: "p", as_of: "2026-11-16", freshness: { state: "fresh" as const, rule: "fno_calendar" as const, built_at: null, age_minutes: null, reason: null } });
  return {
    page: async <T>(key: FnoPageKey) => {
      if (key !== FNO_PAGES.getFnoPageHolds) throw new BlockEmpty("not_published", "2026-11-16T05:00:00.000Z");
      if (holds instanceof Error) throw holds;
      return envelope<T>(holds);
    },
    status: async () => ({ publication_id: "p", as_of: "2026-11-16", freshness: { state: "fresh", rule: "fno_calendar", built_at: null, age_minutes: null, reason: null } }),
  };
}

const shellHeld = async (holds: FnoPageHolds | Error) => (await fnoShellData(reader(holds), fixtureShellData, nseCalendar, NOW).read()).markets.india.fno_live?.held;

test("the frame's picks carry the hold of page `today`; none when not held or the holds cannot be read", async () => {
  assert.deepEqual(await shellHeld(held), { picks: holdOf(held, "today") });
  assert.equal((await shellHeld(held))?.picks?.nothing, true);
  assert.equal(await shellHeld(none), undefined);
  assert.equal(await shellHeld(new FnoUnavailable("network")), undefined, "a failed holds read invents no notice");
});

test("Home's books read the holds through the same reader; the examples hold nothing", async () => {
  assert.deepEqual(await fnoHomeData(reader(held), fixtureHomeData).fnoHolds(), held);
  assert.deepEqual(holdOf(await fnoHomeData(reader(held), fixtureHomeData).fnoHolds(), "risk")?.nothing, true);
  assert.deepEqual(await fixtureHomeData.fnoHolds(), { holds: [] });
});

/** How each page's hold is shown. "not held" pages: exepex/trading P11 raises no hold for them today (only Home's picks
 *  and books, and the card's own `withheld`); a page P11 starts to hold moves to a shown kind with its notice. */
const SHOWN: Record<FnoBlockName, "HeldBlock" | "frame picks" | "Home books" | "card withheld" | "the list" | "not held"> = {
  getScreenerSummaryIndia: "not held", getScreenerStocksIndia: "not held", getFnoScreenerSummary: "not held", getFnoScreenerRows: "not held",
  getOverviewIndicesIndia: "not held", getIndiaSectors: "not held", getFlows: "not held", getSessionIndia: "not held", getIndicesIndia: "not held",
  getFnoEvents: "not held", getFnoPicks: "frame picks", getFnoBooks: "Home books", getFnoWeather: "HeldBlock", getFnoWeatherHistory: "HeldBlock",
  getFnoForecastLab: "HeldBlock", getFnoStrategyLab: "HeldBlock", getFnoPaperTrades: "HeldBlock", getFnoDataHealth: "HeldBlock", getFnoBudget: "HeldBlock",
  getFnoScoreboards: "HeldBlock", getFnoCard: "card withheld", getFnoPageHolds: "the list",
};

/** The modules that read each held endpoint outside the W3 screens, each checked below for its notice. */
const READERS: Partial<Record<FnoBlockName, string[]>> = {
  getFnoPicks: ["lib/shell/azure-source.ts"],
  getFnoBooks: ["app/(cockpit)/[market]/_home/blocks.tsx", "lib/home/azure-source.ts"],
};

const code = (path: string) => readFileSync(join(web, path), "utf8");
const appCode = () => ["app", "components", "lib"].flatMap(sources).filter((f) => !/(^|\/)tests\//.test(f.path));
const readersOf = (name: string, files = appCode()) => files.filter((f) => new RegExp(`FNO_PAGES\\.${name}\\b`).test(f.text)).map((f) => f.path).sort();

test("every page key has one way its hold is shown, and every reader of a held Home page shows the notice", () => {
  assert.deepEqual(Object.keys(SHOWN).sort(), Object.keys(FNO_PAGES).sort(), "a new page key must say how its hold is shown");
  for (const name of ["getFnoPicks", "getFnoBooks"] as const) assert.deepEqual(readersOf(name), READERS[name], `${name}: a new reader needs its own notice`);
  assert.match(code("lib/shell/azure-source.ts"), /holdOf\(holds\.value, FNO_PAGES\.getFnoPicks\)/);
  assert.match(code("components/frame/fno-picks.tsx"), /const held = shell\.fno_live\?\.held\?\.picks;[\s\S]*<HeldNotice bold=\{held\.words\}/);
  assert.match(code("app/(cockpit)/[market]/_home/blocks.tsx"), /holdOf\(holds\.value, FNO_PAGES\.getFnoBooks\)[\s\S]*booksHeld=\{held\}/);
  assert.match(code("components/home/who-trades.tsx"), /\{booksHeld \? <HeldNotice bold=\{booksHeld\.words\}/);
  for (const [name, kind] of Object.entries(SHOWN)) {
    if (kind === "HeldBlock") assert.ok(readersOf(name).every((p) => /^lib\/fno-[a-z-]+\/azure-source\.ts$/.test(p)), `${name}: read only by its W3 screen (holds.test.ts checks its HeldBlock)`);
  }
});

test("the check catches a planted reader of a held page with no notice", () => {
  const planted = { path: "lib/planted/azure-source.ts", text: "const x = FNO_PAGES.getFnoBooks;\n" };
  assert.deepEqual(readersOf("getFnoBooks", [...appCode(), planted]), [...(READERS.getFnoBooks ?? []), planted.path].sort());
});
