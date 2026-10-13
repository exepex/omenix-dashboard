// The W14 audit run (owner's UI feedback, 13 Oct 2026): every built page at 1280 and 390 px, answered from the
// harness fixtures, checked for the four reported problems. Writes <out>/audit.json and <out>/audit.md, and a
// screenshot per page and width. Usage (from web/, with `next start -p <port>` already serving the build):
//   node tests/ui/w14-audit.mjs --port 3124 --out ../work/w14-after
// It reports and never fails: the pass/fail checks are cases/w14.mjs in the harness.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { affordanceFindings } from "./affordance.mjs";
import { apiFixture } from "./fixtures.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const origin = `http://127.0.0.1:${arg("--port", "3124")}`;
const out = resolve(arg("--out", "../work/w14"));

export const AUDIT_PAGES = [
  ["Home (31-dashboard)", "/india"], ["Home, US", "/us"], ["Screener (33)", "/india/screener"], ["Screener F&O (33)", "/india/screener?tab=fno"],
  ["Markets (34)", "/india/markets"], ["Company / stock page (35)", "/india/stocks/RELIANCE"], ["Stock strategies", "/india/stocks/RELIANCE/strategies"],
  ["Trade story", "/india/stocks/RELIANCE/lifecycle/2026-01-05"], ["Strategy lab (38)", "/india/strategy-lab"], ["Paper portfolios", "/india/paper-portfolios"],
  ["Rule vs AI", "/india/rule-vs-ai"], ["Track record", "/india/track-record"], ["Watchlist", "/india/watchlist"], ["News", "/india/news"],
  ["Companies", "/india/companies"], ["Assistant", "/india/assistant"], ["Help", "/india/help"],
];

function playwright() {
  const require = createRequire(import.meta.url);
  try { return require("playwright"); } catch { return require(join(execSync("npm root -g").toString().trim(), "playwright")); }
}

/** The flyout after a click on a rail group that has one: is it still on screen once the new page shows? */
async function flyoutAfterClick(page) {
  const group = page.locator(".mb-rail-grp:has(.mb-rail-fly) .mb-rail-item[href]:not([aria-current])").first();
  if (!(await group.count())) return "no rail group with a flyout";
  const href = await group.getAttribute("href");
  await group.click();
  await page.waitForURL((u) => u.pathname === href.split("?")[0], { timeout: 15000 }).catch(() => undefined);
  await page.waitForTimeout(800);
  const open = await page.$$eval(".mb-rail-fly", (f) => f.filter((x) => getComputedStyle(x).display !== "none").length);
  return open ? `a flyout stays open after the click on the rail (${href})` : "";
}

async function chartControls(page) {
  return page.$$eval(".chart svg, svg.plot", (s) => s.map((x) => Boolean(x.closest("[data-zoom]"))));
}

async function main() {
  const browser = await playwright().chromium.launch({ executablePath: existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined });
  mkdirSync(out, { recursive: true });
  const report = [];
  for (const [label, path] of AUDIT_PAGES) {
    for (const width of [1280, 390]) {
      const mobile = width < 600;
      const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage();
      await page.route(`${origin}/api/v1/**`, async (route) => route.fulfill(await apiFixture(route.request().url(), {})));
      await page.goto(origin + path, { waitUntil: "load" });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(800);
      const findings = await affordanceFindings(page);
      const charts = await chartControls(page);
      const slug = path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
      await page.screenshot({ path: join(out, `${slug}-${width}.png`), fullPage: false });
      const flyout = width === 1280 ? await flyoutAfterClick(page) : "";
      report.push({ label, path, width, findings, charts: charts.length, zoomable: charts.filter(Boolean).length, flyout });
      await ctx.close();
    }
  }
  await browser.close();
  writeFileSync(join(out, "audit.json"), JSON.stringify(report, null, 1));
  const lines = ["| Page | Width | Look findings | Charts (with zoom) | Flyout after a rail click |", "|---|---|---|---|---|"];
  for (const r of report) lines.push(`| ${r.label} \`${r.path}\` | ${r.width} | ${r.findings.length ? r.findings.join("; ") : "none"} | ${r.charts} (${r.zoomable}) | ${r.width === 1280 ? r.flyout || "closes" : "n/a"} |`);
  writeFileSync(join(out, "audit.md"), lines.join("\n") + "\n");
  console.log(`audit: ${report.reduce((s, r) => s + r.findings.length, 0)} look findings over ${report.length} page views; ${out}/audit.md`);
}

main().catch((e) => { console.error(e); process.exit(1); });
