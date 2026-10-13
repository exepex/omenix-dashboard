// UI cases of story W14 (the owner's UI feedback of 13 Oct 2026): the four reported problems, checked on the running
// app. Loading: a slow answer shows the block's loader in the block whose control asked (never over the screen), and
// the page loader on a move to another screen; each only after the delay. Buttons and links: no control looks like a
// label (tests/ui/affordance.mjs); a disabled one keeps a dashed border, the not-allowed cursor, is out of the Tab
// order and does nothing on a click. The rail's flyout closes on a move, on Escape and on a click elsewhere. Price
// charts zoom, pan, reset and read each point with the crosshair.
import { affordanceFindings } from "../affordance.mjs";
import { mockupPayload } from "../fixtures.mjs";
import { cases as assistant } from "./assistant.mjs";
import { cases as companies } from "./companies.mjs";
import { cases as company } from "./company.mjs";
import { cases as help } from "./help.mjs";
import { cases as news } from "./news.mjs";
import { cases as paper } from "./paper-portfolios.mjs";
import { cases as ruleVsAi } from "./rule-vs-ai.mjs";
import { cases as trackRecord } from "./track-record.mjs";
import { cases as watchlist } from "./watchlist.mjs";

const SIGNED_OFF = [
  ["home", "/india", ".home .mb-apcard"], ["home-us", "/us", ".home .mb-apcard"], ["screener", "/india/screener", ".mb-scr-look"],
  ["screener-fno", "/india/screener?tab=fno", ".mb-pf-inner"], ["markets", "/india/markets", ".markets svg"], ["stock", "/india/stocks/RELIANCE", ".chart svg"],
  ["strategy-lab", "/india/strategy-lab", ".mb-pf-inner"],
];
// The other built pages, each in its own page case's set-up (its fixture answers and routes), with the look check.
const OTHER_PAGES = ["company-reliance", "strategies-reliance", "lifecycle-reliance", "paper-portfolio-v3-india", "rule-vs-ai-india", "track-record-india", "watchlist-india", "news-india", "companies-india", "assistant-india", "help-india"];

// Strategy internals stay private (owner, 13 Oct 2026). The fixture still carries them (the mockup's registry), so
// these cases prove the pages never draw them even if an answer did; the API drops them as well
// (lib/strategy-pages/tests/public-strategies.test.ts).
const INTERNAL_WORDS = [/news weight/i, /regime filter/i, /news statuses/i, /news materiality/i, /global cues: /i, /signal: model/i, /sees the model score/i,
  /blind to the model score/i, /differs in /i, /changes one setting/i, /chance of a rise is at least/i, /\bbar \d+%/, /the reference strategy’s bar/i, /no chance threshold/i];
const DESCRIPTIONS = Object.values(mockupPayload("05-strategy-lab", "india").strategies).map((s) => s.description).filter(Boolean);
const LAB_PICKS = ["rule.model_news.v1", "rule.model_news_strict.v1", "rule.model_news_calm.v1", "base.model_only.v1", "ai.combined.opus.v1"];

async function noInternals(page) {
  const problems = [];
  const scan = async (where) => {
    const html = await page.evaluate(() => document.querySelector(".mb-pf-main")?.innerHTML ?? "");
    for (const re of INTERNAL_WORDS) if (re.test(html)) problems.push(`${where}: shows "${html.match(re)[0]}"`);
    for (const d of DESCRIPTIONS) if (html.includes(d.slice(0, 40))) problems.push(`${where}: shows a strategy description ("${d.slice(0, 40)}…")`);
  };
  if (page.url().includes("strategy-lab")) {
    for (const id of LAB_PICKS) {
      await page.evaluate((h) => { window.location.hash = h; }, encodeURIComponent(id));
      await page.waitForTimeout(150);
      await scan(id);
    }
  } else await scan("help");
  return problems;
}

const looks = async (page) => (await affordanceFindings(page)).map((f) => `look: ${f}`);

/** Delay the server's answers (React Server Component requests) to `path` by `ms`, prefetches excepted. */
async function slowServer(page, path, ms) {
  await page.route((url) => url.pathname === path, async (route) => {
    const h = route.request().headers();
    if (h.rsc && !h["next-router-prefetch"]) await new Promise((r) => setTimeout(r, ms));
    await route.continue();
  });
}

const shown = (page, sel) => page.$eval(sel, (n) => getComputedStyle(n).visibility === "visible" && Number(getComputedStyle(n).opacity) > 0.5).catch(() => false);

async function blockLoader(page) {
  const problems = [];
  await slowServer(page, "/india/screener", 2500);
  const chip = page.locator(".mb-scr-presets button.md-chip").first();
  await chip.click();
  await page.waitForTimeout(60);
  const busy = await page.$$eval('.mb-block[aria-busy="true"]', (b) => b.length);
  if (busy !== 1) problems.push(`${busy} busy blocks right after the click, not 1`);
  if (await shown(page, ".mb-block-veil")) problems.push("the block's loader showed before the delay (flicker)");
  await page.waitForTimeout(700);
  if (!(await shown(page, '.mb-block[aria-busy="true"] > .mb-block-veil'))) problems.push("the block's loader did not show during a slow answer");
  if (!(await page.$('.mb-block[aria-busy="true"]:has(.mb-scr-presets)'))) problems.push("the busy block is not the one holding the clicked chip");
  if (await page.$(".mb-pageload-bar")) problems.push("the whole page showed its loader for a change inside one block");
  const status = await page.textContent('.mb-block[aria-busy="true"] [role="status"]').catch(() => "");
  if (!/Loading/.test(status ?? "")) problems.push(`the block's status reads "${status}"`);
  await page.waitForSelector('.mb-block[aria-busy="true"]', { state: "detached", timeout: 8000 }).catch(() => problems.push("the block stayed busy after the answer"));
  if (!/pre=/.test(page.url())) problems.push(`the click did not move to the screen's view: ${page.url()}`);
  return problems;
}

async function pageLoader(page) {
  const problems = [];
  await slowServer(page, "/india/markets", 2500);
  await page.click('.mb-navrail .mb-rail-item[href="/india/markets"]');
  await page.waitForTimeout(700);
  if (!(await shown(page, ".mb-state.loading"))) problems.push("no page loader while the next screen loads");
  if (!(await page.$(".mb-pageload-bar"))) problems.push("no loading bar under the app bar");
  if (!(await page.$(".mb-pf .mb-navrail"))) problems.push("the frame went away while the page loads");
  await page.waitForSelector(".markets", { timeout: 8000 }).catch(() => problems.push("the next screen never showed"));
  return problems;
}

async function disabledLook(page) {
  const problems = [];
  const one = (await page.$$(".mb-pf [data-trade]:disabled")).find(Boolean) && (await page.locator(".mb-pf [data-trade]:disabled").filter({ visible: true }).first().elementHandle().catch(() => null));
  if (!one) return ["no disabled Buy or Sell while the market is closed"];
  const s = await one.evaluate((n) => ({ style: getComputedStyle(n).borderTopStyle, cursor: getComputedStyle(n).cursor, tab: n.tabIndex, disabled: n.disabled }));
  if (s.style !== "dashed") problems.push(`a disabled Buy/Sell border is ${s.style}, not dashed`);
  if (s.cursor !== "not-allowed") problems.push(`a disabled Buy/Sell cursor is ${s.cursor}`);
  if (!s.disabled) problems.push("a locked Buy/Sell is not disabled");
  if (!(await one.evaluate((n) => Boolean(n.closest("[data-tip]")?.getAttribute("data-tip"))))) problems.push("a locked Buy/Sell gives no reason");
  await one.click({ force: true });
  await page.waitForTimeout(200);
  if (await page.$(".mb-drawer.open")) problems.push("a click on a disabled Buy/Sell opened the order window");
  return problems;
}

async function flyout(page) {
  const problems = [];
  const open = () => page.$$eval(".mb-rail-fly", (f) => f.filter((x) => getComputedStyle(x).display !== "none").length);
  const item = page.locator('.mb-navrail .mb-rail-item[href="/india/markets"]');
  await item.hover();
  if ((await open()) !== 1) problems.push("hovering a rail group did not show its flyout");
  await item.click();
  await page.waitForURL("**/india/markets", { timeout: 8000 });
  await page.waitForTimeout(400);
  if (await open()) problems.push("the flyout stayed open after the move to the next screen");
  await page.mouse.move(700, 500);
  await item.focus();
  if ((await open()) !== 0) problems.push("the group's flyout reopened by itself");
  await page.locator('.mb-navrail .mb-rail-item[href="/india/screener"]').focus();
  if ((await open()) !== 1) problems.push("keyboard focus on another group did not show its flyout");
  await page.keyboard.press("Escape");
  if (await open()) problems.push("Escape did not close the flyout");
  const focus = await page.evaluate(() => document.activeElement?.getAttribute("href"));
  if (focus !== "/india/screener") problems.push(`after Escape the focus is on ${focus}, not the group's rail item`);
  await page.keyboard.press("ArrowDown");
  if ((await open()) !== 1) problems.push("ArrowDown on the rail item did not reopen the flyout");
  await page.mouse.click(700, 500);
  if (await open()) problems.push("a click elsewhere did not close the flyout");
  return problems;
}

const span = (page, scope) => page.textContent(`${scope} .mb-zoom-span`);

async function chartZoom(page, { width }, scope = ".mb-pf-inner", initial = null) {
  const problems = [];
  const first = await span(page, scope);
  const m = /Showing (\d+) of (\d+)/.exec(first ?? "");
  if (!m) return [`no zoom bar on the chart (${first})`];
  const [n0, all] = [Number(m[1]), Number(m[2])];
  if (initial !== null && n0 !== Math.min(initial(width), all)) problems.push(`the chart opened on ${n0} of ${all}, not ${initial(width)}`);
  await page.click(`${scope} [aria-label="Zoom in"]`);
  const n1 = Number(/Showing (\d+)/.exec(await span(page, scope))[1]);
  if (!(n1 < n0)) problems.push(`Zoom in left ${n1} of ${n0} shown`);
  const host = page.locator(`${scope} [data-zoom]`).first();
  const box = await host.boundingBox();
  if (width >= 600) {
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -200);
    await page.keyboard.up("Control");
    await page.waitForTimeout(100);
    const n2 = Number(/Showing (\d+)/.exec(await span(page, scope))[1]);
    if (!(n2 < n1)) problems.push(`Ctrl + wheel did not zoom in (${n1} → ${n2})`);
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
    if (!(await page.$(`${scope} .mb-xhair text`))) problems.push("no crosshair with its date and price on hover");
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    if (!/drag to move/.test(await span(page, scope))) problems.push("the zoomed chart does not say it can be dragged");
  }
  await page.click(`${scope} [aria-label="Reset the zoom"]`);
  if ((await span(page, scope)) !== first) problems.push(`Reset gave "${await span(page, scope)}", not "${first}"`);
  const svg = page.locator(`${scope} [data-zoom] svg`).first();
  await svg.focus();
  await page.keyboard.press("+");
  const n3 = Number(/Showing (\d+)/.exec(await span(page, scope))[1]);
  if (!(n3 < n0)) problems.push("the + key did not zoom in");
  await page.keyboard.press("0");
  if ((await span(page, scope)) !== first) problems.push("the 0 key did not reset");
  return problems;
}

const PHONE_SESSIONS = (width) => (width < 600 ? 30 : Infinity);

export const cases = [
  ...SIGNED_OFF.map(([name, path, waitFor]) => ({ name: `w14-look-${name}`, path, waitFor, widths: [1280, 390], check: looks })),
  ...OTHER_PAGES.map((name) => {
    const base = [...assistant, ...companies, ...company, ...help, ...news, ...paper, ...ruleVsAi, ...trackRecord, ...watchlist].find((c) => c.name === name);
    if (!base) throw new Error(`w14: no page case ${name}`);
    return { ...base, name: `w14-look-${name}`, mockup: undefined, expectText: undefined, widths: [1280, 390], check: looks };
  }),
  { name: "w14-no-internals-lab", path: "/india/strategy-lab", widths: [1280], waitFor: ".p-lab .lb", check: noInternals },
  { name: "w14-no-internals-help", path: "/india/help", widths: [1280], waitFor: "#strategies", check: noInternals },
  { name: "w14-block-loader", path: "/india/screener", widths: [1280, 390], waitFor: ".mb-scr-presets", check: blockLoader },
  { name: "w14-page-loader", path: "/india/screener", widths: [1280], waitFor: ".mb-scr-look", check: pageLoader },
  { name: "w14-disabled", path: "/india", widths: [1280, 390], waitFor: ".home .mb-apcard", check: disabledLook },
  { name: "w14-flyout", path: "/india", widths: [1280], waitFor: ".home .mb-apcard", check: flyout },
  { name: "w14-chart-stock", path: "/india/stocks/RELIANCE", widths: [1280, 390], waitFor: ".chart svg", check: (p, c) => chartZoom(p, c, ".mb-pf-inner", PHONE_SESSIONS) },
  { name: "w14-chart-markets", path: "/india/markets", widths: [1280, 390], waitFor: ".markets [data-zoom] svg", check: (p, c) => chartZoom(p, c, ".markets section:has(> [data-zoom])") },
];
