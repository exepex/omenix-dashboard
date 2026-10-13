// The Screener's checks on the running app (story W12), used by cases/screener.mjs. Criterion 3: every figure equals
// its own source field of the blocks the page read (the adapter's output for the page's own URL state), incl. the
// breadth counts; plants prove it bites. Criterion 4: F&O and India-only elements are absent in the US. Criterion 5:
// Buy / Sell only for followed companies, grey with the reason otherwise.
import { fixtureScreenerData as data } from "../../../lib/screener/fixture-source.ts";
import { isToolsScreen, toolsOrder } from "../../../lib/screener/screens.ts";
import { fnoQuery, readState, stocksQuery } from "../../../lib/screener/state.ts";
import { figureChecks, unsourced } from "./sourced.mjs";

/** The blocks the page read for its URL, by the names its figures use. */
async function blocksOf(page, market) {
  const state = readState(Object.fromEntries(new URL(page.url()).searchParams), market);
  const [summary, tools] = await Promise.all([data.summary(market), data.tools(market)]);
  if (state.tab === "fno") return { state, blocks: { summary, fnoSummary: await data.fnoSummary(), fnoRows: await data.fnoRows(fnoQuery(state)) } };
  const fnoSummary = market === "india" ? await data.fnoSummary() : undefined;
  return { state, blocks: { summary, tools, fnoSummary, stocks: await data.stocks(market, stocksQuery(state, tools)) } };
}

/** Plants: a real count from another universe, a figure off by a cent, a field that does not exist. */
function plants(blocks, market) {
  const u = blocks.summary.universes;
  const own = market === "india" ? "all" : "ours";
  const other = market === "india" ? u.n500.up : u.ours.up + 1;
  return [
    { why: "another universe's count under this universe's source", src: `summary:universes.${own}.up`, text: other.toLocaleString("en-IN") },
    { why: "a row figure off by one cent", src: blocks.stocks ? "stocks:rows[0].p" : "fnoRows:rows[0].fut", text: ((blocks.stocks ? blocks.stocks.rows[0].p : blocks.fnoRows.rows[0].fut) + 0.01).toFixed(2) },
    { why: "a source that does not exist", src: "summary:universes.nowhere.up", text: "1" },
  ];
}

export async function screenerChecks(page, { market }) {
  const { state, blocks } = await blocksOf(page, market);
  const problems = await figureChecks(page, ".screener", blocks, plants(blocks, market));
  const rows = ".mb-scr tbody tr:not(:has(.quiet))";
  for (const col of state.tab === "fno" ? [2, 3, 6, 8] : [2, 3]) for (const t of await unsourced(page, `${rows} td:nth-child(${col})`)) problems.push(`row figure without a source: ${t}`);
  for (const t of await unsourced(page, ".mb-scr-look .mb-scr-tile b")) problems.push(`tile figure without a source: ${t}`);
  if (state.tab === "stocks") problems.push(...(await tradeProblems(page, blocks)), ...(await orderProblems(page, state, blocks)));
  return problems;
}

/** The tools-based screens read in the tools block's order (most buying, soonest results), as signed off. */
async function orderProblems(page, state, blocks) {
  if (state.sort || !state.pre || !isToolsScreen(state.pre)) return [];
  const want = toolsOrder(blocks.stocks.rows, blocks.tools, state.pre).map(({ r }) => r.s).join(" ");
  const got = (await page.$$eval(".mb-scr tbody tr .nm > :first-child", (ns) => ns.map((n) => n.textContent))).join(" ");
  return got === want ? [] : [`the ${state.pre} rows read "${got}", not the tools order "${want}"`];
}

/** Followed companies trade through the frame (B / S, the lock's reason while closed); every other row is grey with
 *  the reason. */
async function tradeProblems(page, blocks) {
  const followed = new Set(blocks.tools.companies.map((c) => c.s));
  const rows = await page.$$eval(".mb-scr tbody tr", (trs) =>
    trs.filter((tr) => !tr.querySelector(".quiet")).map((tr) => ({ s: tr.querySelector(".nm > :first-child")?.textContent, trade: !!tr.querySelector("[data-trade]"), grey: tr.querySelector("[data-unavailable]")?.getAttribute("data-tip") ?? null })),
  );
  const problems = [];
  for (const r of rows) {
    if (followed.has(r.s) && !r.trade) problems.push(`${r.s} is followed but has no Buy / Sell`);
    if (!followed.has(r.s) && (r.trade || !r.grey)) problems.push(`${r.s} is not followed but its Buy / Sell are not grey with a reason`);
    if (!followed.has(r.s) && r.grey && !/do not follow|closed|opens/i.test(r.grey)) problems.push(`${r.s}: the grey Buy / Sell give no reason (${r.grey})`);
  }
  return problems;
}

/** The US: no F&O tab, no F&O tag, no delivery, no F&O block read (absent, not empty). */
export async function usScreenerChecks(page, ctx) {
  const problems = await screenerChecks(page, ctx);
  const text = await page.$eval(".screener", (n) => n.innerText);
  if (/F&O|Delivery|delivery/.test(text)) problems.push("an F&O or delivery element on the US Screener");
  if (await page.$('.screener [aria-label="What to screen"], .screener [data-src^="fnoSummary"], .screener [data-src^="fnoRows"]')) problems.push("an F&O element (empty or not) on the US Screener");
  return problems;
}
