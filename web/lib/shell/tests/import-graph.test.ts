// Story W8 AC5 and AC6 (structure): components depend on the frame's contract and the ShellData interface only, never
// on an adapter or a data client; the adapter is chosen in one line of lib/shell/wiring.ts, read only by the market
// layout; and the frame has no path that submits an order. One resolver (./imports.ts) reads every import form; each
// rule is a pure check over (path, source) pairs, proven to catch planted breaches.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { canonical, computedImports, importsOf, reachable, sources, web, type Source } from "./imports.ts";

/** The whole app's code (tests aside): every place an import of the adapter could hide. */
const appCode = (): Source[] => ["app", "components", "lib", "middleware.ts"].flatMap(sources).filter((f) => !/(^|\/)tests\//.test(f.path));
const ADAPTER = /^lib\/shell\/(fixture-source$|azure-source$|fixture\/)/;
const WIRING = "lib/shell/wiring";
/** May import the adapter: the wiring (the one place that picks it) and the adapter itself (its fixture). */
const MAY_IMPORT_ADAPTER = (path: string) => [WIRING, "lib/shell/fixture-source"].includes(canonical(path));
/** May import the wiring: only the market layout. */
const LAYOUT = "app/(cockpit)/[market]/layout.tsx";

/** Rule 1 (KISS): no module but the wiring imports the adapter or its fixture, so no re-export can carry it. */
export function adapterImports(files: Source[]): string[] {
  return files.filter((f) => !MAY_IMPORT_ADAPTER(f.path)).flatMap((f) => importsOf(f).filter((m) => ADAPTER.test(m)).map((m) => `${f.path} imports ${m}`));
}

/** Rule 2: no module but the market layout imports the wiring. */
export function wiringReaders(files: Source[]): string[] {
  return files.filter((f) => importsOf(f).includes(WIRING)).map((f) => f.path);
}

/** Rule 3: nothing the frame's components reach, directly or through any chain of modules, is an adapter, the
 *  wiring, a backend's data client or a server SDK. */
const FORBIDDEN = [ADAPTER, /^lib\/shell\/wiring$/, /^lib\/fno\//, /^lib\/data\/(?!constants$)/, /^lib\/tools\//, /^lib\/assistant\//, /^lib\/ui\/(api-client|use-api)$/, /^pg$/, /^@anthropic-ai\//, /^next\/server$/];
export function forbiddenReach(start: Source[], all: Source[]): string[] {
  return [...reachable(start, all)].filter((m) => FORBIDDEN.some((re) => re.test(m))).sort();
}

const frame = sources("components/frame");
const shell = sources("lib/shell").filter((f) => !f.path.includes("/tests/"));

test("frame components reach no adapter, wiring, fixture or data client, directly or transitively", () => {
  assert.ok(frame.length >= 10, "the frame's components are scanned");
  assert.ok(reachable(frame, appCode()).has("lib/shell/market"), "the walk follows the frame's own imports");
  assert.deepEqual(forbiddenReach(frame, appCode()), []);
});

test("no module but the wiring imports the adapter; only the market layout imports the wiring", () => {
  assert.deepEqual(adapterImports(appCode()), []);
  assert.deepEqual(wiringReaders(appCode()), [LAYOUT]);
  assert.match(readFileSync(join(web, LAYOUT), "utf8"), /from "\.\.\/\.\.\/\.\.\/lib\/shell\/wiring\.ts"/);
});

test("one resolver: the @/ alias, extensionless, .ts, .tsx and index imports name the same module", () => {
  const from = "components/frame/x.tsx";
  for (const spec of ["@/lib/shell/fixture-source", "@/lib/shell/fixture-source.ts", "../../lib/shell/fixture-source", "../../lib/shell/fixture-source.ts", "../../lib/shell/fixture-source/index.ts"]) {
    assert.deepEqual(importsOf({ path: from, text: `import { a } from "${spec}";` }), ["lib/shell/fixture-source"], spec);
  }
  for (const text of ["const m = await import(`@/lib/shell/fixture-source`);", "const m = require(`../../lib/shell/fixture-source.ts`);"]) {
    assert.deepEqual(importsOf({ path: from, text }), ["lib/shell/fixture-source"], text);
  }
  assert.deepEqual(importsOf({ path: from, text: '// import { a } from "../../lib/shell/fixture-source";\nexport {};' }), [], "comments are not imports");
});

test("the checks catch a planted breach: alias, extensionless, dynamic, JSON, re-export through a helper, client via a helper", () => {
  const real = appCode();
  const plant = (...files: Source[]) => [...real, ...files];
  const comp = (line: string): Source => ({ path: "components/frame/planted.tsx", text: `${line}\nexport const x = 1;\n` });
  for (const line of [
    'import { fixtureShellData } from "@/lib/shell/fixture-source";',
    'import { fixtureShellData } from "../../lib/shell/fixture-source";',
    'import { fixtureShellData } from "../../lib/shell/fixture-source.ts";',
    'const m = await import("@/lib/shell/fixture-source.ts");',
    "const m = await import(`@/lib/shell/fixture-source`);",
    'import raw from "../../lib/shell/fixture/shell.generated.json" with { type: "json" };',
  ]) {
    assert.deepEqual(adapterImports(plant(comp(line))).length, 1, line);
    assert.ok(forbiddenReach([comp(line)], plant(comp(line))).some((m) => ADAPTER.test(m)), line);
  }
  // a helper that re-exports the adapter is itself a breach (rule 1), and the component using it reaches it (rule 3)
  const helper: Source = { path: "lib/shell/helpers-x.ts", text: 'export { fixtureShellData } from "./fixture-source";\n' };
  const user = comp('import { fixtureShellData } from "@/lib/shell/helpers-x";');
  assert.deepEqual(adapterImports(plant(helper, user)), ["lib/shell/helpers-x.ts imports lib/shell/fixture-source"]);
  assert.ok(forbiddenReach([user], plant(helper, user)).includes("lib/shell/fixture-source"));
  // a data client through a helper, and the wiring read by a component
  const client: Source = { path: "lib/shell/reader-x.ts", text: 'export { readMarketPage } from "../data/handler";\n' };
  const reader = comp('import { readMarketPage } from "../../lib/shell/reader-x";');
  assert.ok(forbiddenReach([reader], plant(client, reader)).includes("lib/data/handler"));
  const wired = comp('import { shellData } from "@/lib/shell/wiring";');
  assert.deepEqual(wiringReaders(plant(wired)).sort(), [LAYOUT, "components/frame/planted.tsx"].sort());
  // allowed: the market type
  assert.deepEqual(forbiddenReach([comp('import type { Market } from "@/lib/data/constants";')], real), []);
});

test("no computed dynamic import in the app: every import target is a literal the checks can follow", () => {
  assert.deepEqual(appCode().filter(computedImports).map((f) => f.path), []);
  for (const text of ["const m = await import(`@/lib/shell/${name}`);", "const m = await import(target);", 'const m = require("@/lib/" + x);']) {
    assert.equal(computedImports({ path: "components/frame/planted.tsx", text }), true, text);
  }
  for (const text of ['const m = await import("@/lib/shell/market");', "const m = await import(`@/lib/shell/market`);", "export {};"]) {
    assert.equal(computedImports({ path: "components/frame/planted.tsx", text }), false, text);
  }
});

test("the adapter is one line of the wiring", () => {
  const wiring = readFileSync(join(web, "lib/shell/wiring.ts"), "utf8");
  assert.equal([...wiring.matchAll(/^export const shellData: ShellData = fnoReader \? fnoShellData\(fnoReader, fixtureShellData, nseCalendar\) : fixtureShellData;$/gm)].length, 1);
});

/** A network call or a form: what any submit path needs. */
const NETWORK = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|new\s+WebSocket|EventSource|<form\b|onSubmit|method\s*:\s*["'](POST|PUT|PATCH|DELETE)/;
/** In the frame's own code, not even an API path (lib/ui/routes.ts, reached for page links, builds read paths only). */
const API_PATH = /["'`]\/api\//;

export function submitPaths(files: Source[], pattern: RegExp): string[] {
  return files.filter((f) => pattern.test(f.text.replace(/\/\/.*$/gm, ""))).map((f) => f.path);
}

test("AC6: no network call or form in the frame, its logic or any module they reach; no API path in the frame's own code", () => {
  const all = appCode();
  const reached = [...reachable(frame, all)];
  const local = all.filter((f) => reached.includes(canonical(f.path)));
  assert.ok(local.length > frame.length, "the reached modules are scanned too");
  assert.deepEqual(submitPaths([...local, ...shell], NETWORK), []);
  assert.deepEqual(submitPaths([...frame, ...shell], API_PATH), []);
  assert.deepEqual(submitPaths([{ path: "planted.tsx", text: 'await fetch("/api/v1/orders", { method: "POST" });' }], NETWORK), ["planted.tsx"]);
  assert.deepEqual(submitPaths([{ path: "planted.tsx", text: "<form onSubmit={send}>" }], NETWORK), ["planted.tsx"]);
  assert.deepEqual(submitPaths([{ path: "planted.tsx", text: 'const u = "/api/v1/orders";' }], API_PATH), ["planted.tsx"]);
});

test("AC6: the order window's foot button is always disabled and has no action", () => {
  const text = readFileSync(join(web, "components/frame/order-window.tsx"), "utf8");
  const buttons = [...text.matchAll(/<button\b[^>]*>/g)].map((m) => m[0]);
  const foot = buttons.filter((b) => b.includes('data-submit="none"'));
  assert.equal(foot.length, 1);
  assert.match(foot[0], /\sdisabled\s/);
  assert.doesNotMatch(foot[0], /onClick|disabled=\{/);
  assert.ok(buttons.every((b) => b.includes('data-submit="none"') || !/onClick/.test(b)), "no other clickable button in the order window");
});
