// Home's checks on the running app (story W9), used by cases/home.mjs. Criterion 4: every money figure on Home is a
// value of the fixture (the W10 block examples and the frame's 30-shell records) for that market, shown in that
// market's currency: a figure the screen added up across groups, markets or currencies is not in the fixture and fails.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const read = (p) => JSON.parse(readFileSync(join(repo, p), "utf8"));
const blocks = read("api/examples/blocks.json");
const shell = read("design/mockups/30-shell/data.json");
const SYMBOL = { india: "₹", us: "$" };

function numbers(value, out = new Set()) {
  // each value as shown with cents and as shown in whole units (whole rupees: −2,151.80 reads −₹2,152)
  if (typeof value === "number") out.add(Math.round(Math.abs(value) * 100)).add(Math.round(Math.abs(value)) * 100);
  else if (Array.isArray(value)) value.forEach((v) => numbers(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => numbers(v, out));
  return out;
}

/** Every number the fixture holds for a market, in cents (absolute: the sign is shown separately). */
export function fixtureNumbers(market) {
  const own = Object.entries(blocks).filter(([k]) => k.endsWith(`_${market}`) || (market === "india" && k.includes("Fno"))).map(([, v]) => v.value.payload);
  return numbers([own, shell.markets[market]]);
}

/** The money figures shown inside Home (the frame's own overlays aside). Quoted text is left out: a news headline
 *  ("Jio's ₹11 trn IPO") and the needs-you line quoting it are the publisher's words, not the screen's figures. */
export async function shownMoney(page) {
  const text = await page.$eval(".home", (n) => {
    const copy = n.cloneNode(true);
    copy.querySelectorAll(".news li > b, .att small").forEach((q) => q.remove());
    document.body.append(copy);
    const t = copy.innerText;
    copy.remove();
    return t;
  });
  return [...text.matchAll(/([₹$])\s?([\d,]+(?:\.\d+)?)/g)].map((m) => ({ symbol: m[1], text: m[0], cents: Math.round(Number(m[2].replace(/,/g, "")) * 100) }));
}

export function moneyProblems(shown, market, allowed = fixtureNumbers(market)) {
  const problems = [];
  if (!shown.length) problems.push("no money figure found on Home");
  for (const m of shown) {
    if (m.symbol !== SYMBOL[market]) problems.push(`a ${m.symbol} figure in the ${market} market: ${m.text}`);
    else if (!allowed.has(m.cents)) problems.push(`a figure not in the fixture (added up on screen?): ${m.text}`);
  }
  return problems;
}

/** Criterion 4 on the page, and a planted cross-currency sum proves the check bites. */
export async function homeMoneyChecks(page, { market }) {
  const shown = await shownMoney(page);
  const problems = moneyProblems(shown, market);
  const india = fixtureNumbers("india");
  const planted = moneyProblems([{ symbol: "₹", text: "₹4,40,900 + $4,007.60", cents: Math.round((440900 + 4007.6) * 100) }], "india", india);
  if (!planted.length) problems.push("the check did not catch a planted cross-currency sum");
  const groupsSum = moneyProblems([{ symbol: "₹", text: "Rule-based + You", cents: Math.round(Math.abs(-9309.36 + 1800) * 100) }], "india", india);
  if (!groupsSum.length) problems.push("the check did not catch a planted sum of two groups");
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
