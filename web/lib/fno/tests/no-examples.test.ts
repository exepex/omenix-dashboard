// Story W2 (ChatGPT review 28): examples are never a runtime state. With the database configured, loading the Screener's
// and the Markets overview's wiring and using them loads no example and no fixture adapter; with no setting, the same
// call loads them (the control, so the check can fail). The static rule (no module but a wiring imports an adapter, and
// the wiring's one line loads the fixtures lazily) is lib/screener/tests/import-graph.test.ts.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";

const web = join(import.meta.dirname, "..", "..", "..");
const EXAMPLES = /\/lib\/fixtures\/|fixture-source\.ts$/;
const SCRIPT = `
const { screenerData } = await import("./lib/screener/wiring.ts");
const { overviewData } = await import("./lib/overview/wiring.ts");
await Promise.allSettled([screenerData.summary("india"), screenerData.fnoRows({ sort: "oi", page: 1, page_size: 25 }), overviewData.indices("india"), overviewData.flows()]);
console.log(JSON.stringify(globalThis.loadedModules));
`;
const DB = { OMENIX_FNO_PG_HOST: "127.0.0.1", OMENIX_FNO_PG_PORT: "9", OMENIX_FNO_PG_DATABASE: "d", OMENIX_FNO_PG_USER: "u", OMENIX_FNO_PG_PASSWORD: "p" };

function loaded(env: Record<string, string>): string[] {
  const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("OMENIX_FNO_PG_")));
  const out = execFileSync(process.execPath, ["--no-warnings", "--import", "./lib/fno/tests/loaded-modules.mjs", "--input-type=module", "-e", SCRIPT], { cwd: web, env: { ...clean, ...env } as NodeJS.ProcessEnv, encoding: "utf8" });
  return JSON.parse(out.trim().split("\n").pop()!);
}

test("with the database configured, no example or fixture adapter is ever loaded", () => {
  const urls = loaded(DB);
  assert.ok(urls.some((u) => u.endsWith("/lib/screener/azure-source.ts")), "the database adapter is the one used");
  assert.deepEqual(urls.filter((u) => EXAMPLES.test(u)), []);
});

test("control: with no database setting, the same calls load the examples", () => {
  const urls = loaded({});
  assert.ok(urls.some((u) => u.endsWith("/lib/screener/fixture-source.ts")));
  assert.ok(urls.some((u) => /\/lib\/fixtures\/blocks-33-34\.generated\.json$/.test(u)));
});
