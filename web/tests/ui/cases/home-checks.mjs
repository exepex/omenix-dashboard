// Home's checks on the running app (story W9), used by cases/home.mjs. Criterion 4: every money figure on Home names
// its source field (`data-src`, lib/home/sources.ts) and must equal exactly that field of the data the app renders
// (the adapters' own output), with its sign and in that market's currency. A figure the screen added up has no field
// that holds it, so it fails, whatever other value it happens to equal; a money figure without a source fails too.
import { fixtureHomeData } from "../../../lib/home/fixture-source.ts";
import { resolveSource } from "../../../lib/home/sources.ts";
import { fixtureShellData } from "../../../lib/shell/fixture-source.ts";
import { frameData } from "../../../lib/shell/view.ts";

const SYMBOL = { india: "₹", us: "$" };
/** Quoted text: a news headline ("Jio's ₹11 trn IPO") and the needs-you line quoting it are the publisher's words. */
const QUOTED = ".news li > b, .att small";
const MONEY = /([+\u2212-])?\s?([₹$])\s?([\d,]+(?:\.\d+)?)/g;

/** The block payloads a source name can point into, exactly as the app's adapters give them for a market. */
export async function sourceBlocks(market) {
  const [accounts, positions, groups, strategyTrades, fnoBooks, shell] = await Promise.all([
    fixtureHomeData.accounts(market),
    fixtureHomeData.positions(market),
    fixtureHomeData.groups(market),
    fixtureHomeData.strategyTrades(market),
    market === "india" ? fixtureHomeData.fnoBooks() : null,
    fixtureShellData.read().then((p) => frameData(p, market).shell),
  ]);
  return { accounts, positions, groups, strategyTrades, fnoBooks: fnoBooks ?? undefined, shell };
}

/** Every money figure inside Home: the sourced ones with their source name, and those outside any source. */
export async function shownMoney(page, plants = []) {
  return page.$eval(".home", (home, { quoted, plants }) => {
    const added = plants.map(({ src, text }) => {
      const n = document.createElement("span");
      if (src) n.dataset.src = src;
      n.textContent = text;
      return home.appendChild(n);
    });
    const sourced = [...home.querySelectorAll("[data-src]")].filter((n) => !n.closest(quoted)).map((n) => ({ src: n.dataset.src, text: n.textContent.trim() }));
    const copy = home.cloneNode(true);
    copy.querySelectorAll(`[data-src], ${quoted}`).forEach((q) => q.remove());
    document.body.append(copy);
    const rest = copy.innerText;
    copy.remove();
    added.forEach((n) => n.remove());
    return { sourced, rest };
  }, { quoted: QUOTED, plants });
}

/** A shown money text as sign, symbol, amount and shown decimals; null when it is not one money figure. */
function parse(text) {
  const m = [...text.matchAll(MONEY)];
  if (m.length !== 1 || m[0][0].trim() !== text.trim()) return null;
  const [, sign, symbol, digits] = m[0];
  return { negative: sign === "\u2212" || sign === "-", symbol, amount: Number(digits.replace(/,/g, "")), decimals: digits.split(".")[1]?.length ?? 0 };
}

/** What is wrong with the shown figures, given the market's source blocks. */
export function moneyProblems({ sourced, rest }, market, blocks) {
  const problems = [];
  if (!sourced.length) problems.push("no sourced money figure found on Home");
  for (const { src, text } of sourced) {
    const value = resolveSource(src, blocks);
    const shown = parse(text);
    if (typeof value !== "number") problems.push(`${text}: its source ${src} is not a number in the data`);
    else if (!shown) problems.push(`${src}: "${text}" is not one money figure`);
    else if (shown.symbol !== SYMBOL[market]) problems.push(`${src}: a ${shown.symbol} figure in the ${market} market: ${text}`);
    else {
      const scale = 10 ** shown.decimals;
      if (Math.round(Math.abs(value) * scale) !== Math.round(shown.amount * scale) || (value < 0) !== shown.negative)
        problems.push(`${src}: shows ${text}, the field holds ${value}`);
    }
  }
  for (const m of rest.matchAll(MONEY)) problems.push(`a money figure with no source field (computed on screen?): ${m[0].trim()}`);
  return problems;
}

/** A value as Home shows a money figure with cents, in the market's currency. */
const shown = (value, market) => `${value < 0 ? "\u2212" : ""}${SYMBOL[market]}${Math.abs(value).toLocaleString(market === "india" ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The judges' plants, injected into the real page on every run; each must be caught. */
const plants = (blocks, market) => [
  // judge 29, minor 3: a real group figure under another group's source (Rule-based's total labelled as the AI team's)
  { why: "a group figure under another group's source", src: `groups:groups[${blocks.groups.groups.findIndex((g) => g.family === "ai")}].total.net`, text: shown(blocks.groups.groups.find((g) => g.family === "rule").total.net, market) },
  { why: "a sum of two groups (Rule-based + AI team) that equals another figure (the Baselines total)", src: "groups:groups[0].total.net", text: "\u2212₹8,293.55" },
  { why: "a figure with no source", text: "₹4,44,907.60" },
  { why: "a cross-currency sum carrying a real source", src: "accounts:accounts.manual.value", text: "₹4,44,907.60" },
  { why: "a source that does not exist", src: "groups:groups[9].total.net", text: "₹1.00" },
];

/** Criterion 4 on the page, and the plants prove the check bites. */
export async function homeMoneyChecks(page, { market }) {
  const blocks = await sourceBlocks(market);
  const problems = moneyProblems(await shownMoney(page), market, blocks);
  for (const plant of plants(blocks, market)) {
    const caught = moneyProblems(await shownMoney(page, [plant]), market, blocks).length > problems.length;
    if (!caught) problems.push(`the check did not catch ${plant.why}`);
  }
  return problems;
}

/** India: the F&O book lines in every group card; the hybrid empty state; the tabs; the needs-you link. */
export async function indiaChecks(page, ctx) {
  const problems = await homeMoneyChecks(page, ctx);
  const cards = await page.$$eval(".home .mb-apcard", (n) => n.map((x) => x.innerText));
  if (cards.length !== 4) problems.push(`${cards.length} group cards, not 4 (You, Rule-based, Hybrid, AI team)`);
  if (cards.filter((c) => c.includes("F&O: total profit / loss")).length !== 3) problems.push("not every group card has its own F&O book line");
  if (!cards.some((c) => c.includes("No strategy yet"))) problems.push("no Hybrid empty state");
  const tabs = await page.$$eval('.home [aria-label="Who opened the trade"] button', (b) => b.map((x) => x.textContent));
  if (tabs.join("|") !== "All (6)|Yours (1)|Rule-based (1)|Hybrid (0)|AI team (2)|Baselines (2)") problems.push(`tabs: ${tabs.join(" | ")}`);
  await page.click('.home [aria-label="Who opened the trade"] button:has-text("AI team")');
  const rows = await page.$$eval(".home .pos li", (l) => l.length);
  if (rows !== 2) problems.push(`the AI team tab shows ${rows} rows, not 2`);
  return problems;
}

/** The US: no F&O element in Home at all; dollars only. */
export async function usChecks(page, ctx) {
  const problems = await homeMoneyChecks(page, ctx);
  if ((await page.$eval(".home", (n) => n.innerText)).includes("F&O")) problems.push("an F&O element on the US Home");
  return problems;
}

/** The example clock during the session: the top pick's Buy and every row's B and S are live. */
export async function openChecks(page) {
  const locked = await page.$$eval(".home [data-trade]", (b) => b.filter((x) => x.disabled).length);
  return locked ? [`${locked} Buy or Sell controls still locked during the session`] : [];
}
