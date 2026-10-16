// Story W3, privacy rule 5 (trading docs/stories/W3-fno-screens.md): the public gateway (MB_GATEWAY=1) never imports the
// F&O screen code. The roots are what the gateway really serves, read from gatewayDecision itself (its served routes
// and its rewrites' targets, never a rewrite's source: "/" is /about there, not the dashboard's home), plus the
// middleware. The F&O screen code is every module under lib/fno-* and components/fno-*, and every W3 page of
// lib/ui/routes.ts. The rule is a pure check over (path, source) pairs, proven to catch a planted import.
import assert from "node:assert/strict";
import { test } from "node:test";
import { gatewayDecision, OAUTH_ROUTES } from "../../tools/gateway.ts";
import { PAGES } from "../../ui/routes.ts";
import { canonical, reachable, sources, type Source } from "../../shell/tests/imports.ts";

const METHODS = ["GET", "HEAD", "POST", "DELETE"];
const ROUTE_FILE = /^app\/(.*\/)?(route\.ts|page\.tsx)$/;
const SAMPLE: Record<string, string> = { market: "india", slug: `2026-11-16-${"0".repeat(32)}` };

/** The URL a route file answers, with its dynamic segments filled (route groups and parallel slots add none). */
export function urlOf(path: string): string {
  const parts = path.split("/").slice(1, -1).filter((p) => !/^\(.*\)$/.test(p) && !p.startsWith("@"));
  return "/" + parts.map((p) => (p.startsWith("[") ? (SAMPLE[p.slice(1, -1)] ?? "x") : p)).join("/");
}

/** The route files the gateway serves: those it lets through, and the targets of the rewrites it makes. */
export function gatewayRoots(files: Source[]): Source[] {
  const routes = files.filter((f) => ROUTE_FILE.test(f.path));
  const byUrl = new Map(routes.map((f) => [urlOf(f.path), f]));
  const served = new Set<Source>();
  for (const [url, file] of byUrl) {
    for (const method of METHODS) {
      const d = gatewayDecision(url, method, true);
      if (d.action === "next" || d.action === "slack") served.add(file);
    }
  }
  for (const url of [...byUrl.keys(), "/", ...Object.keys(OAUTH_ROUTES)]) {
    for (const method of METHODS) {
      const d = gatewayDecision(url, method, true);
      const target = d.action === "rewrite" ? byUrl.get(d.target) : undefined;
      if (target) served.add(target);
    }
  }
  return [...served, ...files.filter((f) => f.path === "middleware.ts")];
}

const W3_PAGES = PAGES.filter((p) => p.owner === "W3").map((p) => `app/(cockpit)/[market]/${p.segment}/`);

/** True for a module of the F&O screens (any of its files). */
export const isFnoScreen = (mod: string) => /^(lib|components)\/fno-/.test(mod) || W3_PAGES.some((dir) => mod.startsWith(dir));

/** The rule: every F&O screen module the gateway's roots reach, directly or through any chain. */
export function gatewayReachesFno(files: Source[]): string[] {
  return [...reachable(gatewayRoots(files), files)].filter(isFnoScreen).sort();
}

const appCode = (): Source[] => ["app", "components", "lib", "middleware.ts"].flatMap(sources).filter((f) => !/(^|\/)tests\//.test(f.path));

test("the gateway's roots are what gatewayDecision serves: Slack, /mcp and its OAuth targets, the brief, the legal pages", () => {
  const roots = gatewayRoots(appCode()).map((f) => f.path).sort();
  assert.ok(roots.includes("middleware.ts"));
  for (const p of ["app/about/route.ts", "app/privacy/route.ts", "app/terms/route.ts", "app/brief/[market]/[slug]/route.ts", "app/slack/commands/route.ts", "app/mcp/route.ts", "app/mcp/oauth/token/route.ts"]) assert.ok(roots.includes(p), p);
  assert.ok(!roots.includes("app/page.tsx"), "/ is /about on the gateway, never the dashboard's home");
  assert.ok(!roots.some((p) => p.startsWith("app/(cockpit)/") || p.startsWith("app/api/")), "no dashboard page or API is a root");
});

test("the F&O screens include the weather screen's modules and page (the rule's target is not empty)", () => {
  const all = appCode().map((f) => canonical(f.path));
  for (const m of ["lib/fno-weather/view", "components/fno-weather/weather-top", "app/(cockpit)/[market]/weather/page"]) {
    assert.ok(all.includes(m), m);
    assert.ok(isFnoScreen(m), m);
  }
});

test("nothing the gateway serves reaches F&O screen code", () => {
  assert.deepEqual(gatewayReachesFno(appCode()), []);
});

test("a planted import is caught, directly and through a chain", () => {
  const files = appCode();
  const plant = (path: string, line: string) => files.map((f) => (f.path === path ? { path, text: `${line}\n${f.text}` } : f));
  const direct = plant("app/about/route.ts", 'import { verdictOf } from "../../lib/fno-weather/view.ts";');
  assert.ok(gatewayReachesFno(direct).includes("lib/fno-weather/view"));
  const chained = plant("lib/legal/legal.ts", 'import "../../components/fno-weather/weather-top.tsx";');
  assert.ok(gatewayReachesFno(chained).includes("components/fno-weather/weather-top"));
});
