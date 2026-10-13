// Judge 63, criterion 2: "Example" appears only on values from the example records (the fixtures, copied from the
// signed-off mockups), never on a value a runtime read takes from a backend's publication. Tested on the frame data the
// layout really builds: with the fixtures alone, and with the F&O parts read from a publication (W9-F&O).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import type { FnoBlockReader, FnoPageKey } from "../../fno/blocks.ts";
import { nseCalendar } from "../../fno/calendar.ts";
import { FNO_PAGES } from "../../fno/pages.ts";
import { fnoShellData } from "../azure-source.ts";
import type { FrameData } from "../contract.ts";
import { fixtureShellData } from "../fixture-source.ts";
import { dataLabel, exampleTagShown, stockExampleShown } from "../labels.ts";
import { sources, web } from "./imports.ts";
import { frameData } from "../view.ts";

const repo = join(web, "..");
const w10 = JSON.parse(readFileSync(join(repo, "api/examples/blocks.json"), "utf8"));
const published: Partial<Record<FnoPageKey, unknown>> = {
  [FNO_PAGES.getSessionIndia]: w10.getSessionIndia_india.value.payload,
  [FNO_PAGES.getIndicesIndia]: w10.getIndicesIndia_india.value.payload,
  [FNO_PAGES.getFnoPicks]: { currency: "INR", fno_state: { approved: false, note: "Experiment 1 passed no policy." }, rows: [], baskets: {} },
};
const freshness = { state: "fresh" as const, rule: "fno_calendar" as const, built_at: null, age_minutes: null, reason: null };
const reader: FnoBlockReader = {
  page: async <T>(key: FnoPageKey) => ({ payload: published[key] as T, publication_id: "p", as_of: "2026-10-12", freshness }),
  status: async () => ({ publication_id: "p", as_of: "2026-10-12", freshness }),
};
const runtime = async (): Promise<FrameData> => frameData(await fnoShellData(reader, fixtureShellData, nseCalendar, () => new Date("2026-10-13T05:00:00Z")).read(), "india");
const fixtures = async (): Promise<FrameData> => frameData(await fixtureShellData.read(), "india");

test("fixtures alone: the page says Example data once; no figure carries its own tag", async () => {
  const data = await fixtures();
  assert.equal(dataLabel(data), "Example data");
  assert.equal(stockExampleShown(data), false);
  for (const item of Object.values(data.shell.items)) assert.equal(exampleTagShown(data, item), true, item.id);
});

test("a runtime read: no value from the publication is ever labelled Example; the stock figures beside it are", async () => {
  const data = await runtime();
  const live = Object.values(data.shell.items).filter((i) => i.live);
  assert.deepEqual(live.map((i) => i.id).sort(), ["INDIAVIX", "NIFTY50"]);
  for (const item of live) assert.equal(exampleTagShown(data, item), false, `${item.id} is the publication's`);
  for (const item of Object.values(data.shell.items).filter((i) => !i.live)) assert.equal(exampleTagShown(data, item), true, `${item.id} is an example record`);
  assert.equal(stockExampleShown(data), true, "the stock figures say Example beside the real F&O ones");
  assert.equal(dataLabel(data), "stock figures: Example data");
});

test("a runtime read carries no example state in any F&O part", async () => {
  const data = await runtime();
  const fnoParts = JSON.stringify([data.shell.fno_state, data.shell.fno_rows, data.shell.status, ...Object.values(data.shell.items).filter((i) => i.live)]);
  assert.doesNotMatch(fnoParts, /example/i);
  assert.equal(data.shell.fno_state?.note, "Experiment 1 passed no policy.");
});

test("when nothing is example, nothing says Example", async () => {
  const data = { ...(await runtime()), example: false };
  assert.equal(dataLabel(data), "data");
  assert.equal(stockExampleShown(data), false);
  for (const item of Object.values(data.shell.items)) assert.equal(exampleTagShown(data, item), false);
});

test("the frame and the pages draw an Example tag only through these rules", () => {
  const ui = ["components", "app"].flatMap(sources).filter((f) => !f.path.includes("/tests/"));
  const drawers = ui.filter((f) => /mb-tag mock|["'>]Example( data)?["'<]/.test(f.text)).map((f) => f.path).sort();
  assert.deepEqual(drawers, ["components/frame/parts.tsx"], "the footer says it through dataLabel");
  const parts = readFileSync(join(web, "components/frame/parts.tsx"), "utf8");
  assert.match(parts, /if \(!exampleTagShown\(data, item\)\) return null;/);
  assert.match(parts, /if \(!stockExampleShown\(data\)\) return null;/);
  assert.match(readFileSync(join(web, "components/home/home-footer.tsx"), "utf8"), /dataLabel\(data\)/);
});
