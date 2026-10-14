// Strategy internals stay private on every screen (owner, 13 Oct 2026; judge 70): no page's text, tooltip or label
// says how a strategy decides: no bar or threshold, no regime (the cockpit says "market mood"), no number tied to a
// strategy's rule. The words are lib/ui/internal-words.ts, the same list that guards every /api/v1 answer
// (lib/strategy-pages/tests/public-view.test.ts). Each page runs in its own page case's set-up (its fixture answers),
// stored-data variants included; the Strategy lab is read for every strategy.
import { internalWordsIn } from "../../../lib/ui/internal-words.ts";
import { cases as assistant } from "./assistant.mjs";
import { cases as companies } from "./companies.mjs";
import { cases as company } from "./company.mjs";
import { cases as help } from "./help.mjs";
import { cases as home } from "./home.mjs";
import { cases as markets } from "./markets.mjs";
import { cases as news } from "./news.mjs";
import { cases as paper } from "./paper-portfolios.mjs";
import { cases as ruleVsAi } from "./rule-vs-ai.mjs";
import { cases as screener } from "./screener.mjs";
import { cases as strategyLab } from "./strategy-lab.mjs";
import { cases as trackRecord } from "./track-record.mjs";
import { cases as watchlist } from "./watchlist.mjs";

const PAGES = [
  "home-india", "home-us", "markets-india", "screener-stocks", "screener-fno", "company-reliance", "company-forecast-history-dense", "strategies-reliance", "lifecycle-reliance", "paper-portfolio-v3-story",
  "strategy-lab-india", "strategy-lab-us", "strategy-lab-stored-india", "paper-portfolio-v3-india", "rule-vs-ai-india", "rule-vs-ai-stored-india",
  "track-record-india", "track-record-stored-india", "watchlist-india", "news-india", "companies-india", "assistant-india", "help-india", "help-us",
];
const ALL = [assistant, companies, company, help, home, markets, news, paper, ruleVsAi, screener, strategyLab, trackRecord, watchlist].flat();

/** Every text a reader can meet on the page: the text nodes (closed details and hidden tips included) and the
 *  tooltips, labels and titles of every element. */
const pageTexts = (page) => page.evaluate(() => {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest("script, style, noscript") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent.trim()) out.push(n.textContent.trim());
  for (const el of document.body.querySelectorAll("[data-tip], [title], [aria-label], [placeholder], [alt]")) {
    for (const a of ["data-tip", "title", "aria-label", "placeholder", "alt"]) if (el.getAttribute(a)) out.push(el.getAttribute(a));
  }
  return out;
});

async function scan(page, where, found) {
  for (const text of await pageTexts(page)) for (const w of internalWordsIn(text)) found.add(`${where}${w} in "${text.slice(0, 90)}"`);
}

/** The page's texts, and in the Strategy lab every strategy's detail (each name in the scoreboard clicked). */
async function internalsOnScreen(page) {
  const found = new Set();
  await scan(page, "", found);
  const buttons = page.locator(".p-lab .lb button.sel");
  for (let i = 0, n = await buttons.count(); i < n; i++) {
    const name = await buttons.nth(i).textContent();
    await buttons.nth(i).click();
    await page.waitForTimeout(120);
    await scan(page, `${name}: `, found);
  }
  return [...found].slice(0, 12);
}

export const cases = PAGES.map((name) => {
  const base = ALL.find((c) => c.name === name);
  if (!base) throw new Error(`w14-internals: no page case ${name}`);
  return { ...base, name: `w14-internals-${name}`, mockup: undefined, mockupShot: undefined, expectText: undefined, widths: [1280], check: internalsOnScreen };
});
