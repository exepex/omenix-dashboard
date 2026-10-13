// Story W8 AC5 and AC6 (structure): components depend on the frame's contract and the ShellData interface only, never
// on an adapter or a data client; the adapter is chosen in one line of lib/shell/wiring.ts, read only by the market
// layout; and the frame has no path that submits an order. Each rule is a pure check over (path, source) pairs,
// proven to catch a planted breach.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { test } from "node:test";

const web = join(import.meta.dirname, "..", "..", "..");
type Source = { path: string; text: string };

function sources(dir: string): Source[] {
  const out: Source[] = [];
  for (const name of readdirSync(join(web, dir))) {
    const rel = join(dir, name);
    if (statSync(join(web, rel)).isDirectory()) out.push(...sources(rel));
    else if (/\.(ts|tsx)$/.test(name)) out.push({ path: rel, text: readFileSync(join(web, rel), "utf8") });
  }
  return out;
}

/** The modules a file imports (static, dynamic and re-exports), relative ones resolved to web-relative paths. */
export function importsOf(file: Source): string[] {
  const specs = [...file.text.matchAll(/(?:import|export)\s[^'";]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
  return specs.map((s) => (s.startsWith(".") ? normalize(join(dirname(file.path), s)) : s));
}

/** What no component may import: the adapter, the wiring, the fixture, the backends' clients and the server SDKs. */
const FORBIDDEN = [/^lib\/shell\/fixture-source\.ts$/, /^lib\/shell\/wiring\.ts$/, /^lib\/shell\/fixture\//, /^lib\/data\/(?!constants\.ts$)/, /^lib\/tools\//, /^lib\/assistant\//, /^lib\/ui\/(api-client|use-api)\.ts$/, /^pg$/, /^@anthropic-ai\//, /^next\/server$/];

export function forbiddenImports(files: Source[]): string[] {
  return files.flatMap((f) => importsOf(f).filter((m) => FORBIDDEN.some((re) => re.test(m))).map((m) => `${f.path} imports ${m}`));
}

const frame = sources("components/frame");
const shell = sources("lib/shell").filter((f) => !f.path.includes("/tests/"));

test("frame components import no adapter, wiring, fixture or data client", () => {
  assert.ok(frame.length >= 10, "the frame's components are scanned");
  assert.deepEqual(forbiddenImports(frame), []);
});

test("no component and no page part anywhere imports the adapter or the wiring", () => {
  const all = [...sources("components"), ...sources("app")].filter((f) => !f.path.endsWith("app/(cockpit)/[market]/layout.tsx"));
  const adapters = all.flatMap((f) => importsOf(f).filter((m) => /^lib\/shell\/(fixture-source|wiring)\.ts$|^lib\/shell\/fixture\//.test(m)).map((m) => `${f.path} imports ${m}`));
  assert.deepEqual(adapters, []);
});

test("the check catches a planted import of the fixture adapter, the wiring and a data client", () => {
  const planted = (line: string): Source => ({ path: "components/frame/planted.tsx", text: `${line}\nexport const x = 1;\n` });
  assert.deepEqual(forbiddenImports([planted('import { fixtureShellData } from "../../lib/shell/fixture-source.ts";')]), ["components/frame/planted.tsx imports lib/shell/fixture-source.ts"]);
  assert.equal(forbiddenImports([planted('import { shellData } from "../../lib/shell/wiring.ts";')]).length, 1);
  assert.equal(forbiddenImports([planted('import raw from "../../lib/shell/fixture/shell.generated.json" with { type: "json" };')]).length, 1);
  assert.equal(forbiddenImports([planted('import { readMarketPage } from "../../lib/data/handler.ts";')]).length, 1);
  assert.equal(forbiddenImports([planted('const m = await import("../../lib/shell/fixture-source.ts");')]).length, 1);
  assert.equal(forbiddenImports([planted('import type { Market } from "../../lib/data/constants.ts";')]).length, 0, "the market type is allowed");
});

test("the adapter is one line of the wiring, and only the market layout reads the wiring", () => {
  const wiring = readFileSync(join(web, "lib/shell/wiring.ts"), "utf8");
  assert.equal([...wiring.matchAll(/^export const shellData: ShellData = (\w+);$/gm)].length, 1);
  const readers = [...sources("app"), ...sources("components"), ...sources("lib")].filter((f) => importsOf(f).includes("lib/shell/wiring.ts")).map((f) => f.path);
  assert.deepEqual(readers, ["app/(cockpit)/[market]/layout.tsx"]);
});

const SUBMIT = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|new\s+WebSocket|EventSource|<form\b|onSubmit|method\s*:\s*["'](POST|PUT|PATCH|DELETE)|["'`]\/api\//;

export function submitPaths(files: Source[]): string[] {
  return files.filter((f) => SUBMIT.test(f.text.replace(/\/\/.*$/gm, ""))).map((f) => relative(".", f.path));
}

test("AC6: the frame and its logic have no network call, form or API path: nothing can submit an order", () => {
  assert.deepEqual(submitPaths([...frame, ...shell]), []);
  assert.deepEqual(submitPaths([{ path: "planted.tsx", text: 'await fetch("/api/v1/orders", { method: "POST" });' }]), ["planted.tsx"]);
  assert.deepEqual(submitPaths([{ path: "planted.tsx", text: "<form onSubmit={send}>" }]), ["planted.tsx"]);
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
