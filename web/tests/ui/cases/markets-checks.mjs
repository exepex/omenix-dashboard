// The Markets overview's checks on the running app (story W12), used by cases/markets.mjs. Criterion 3: every figure
// equals its own source field (breadth counts, movers, flows and the rest), and a flows period without full coverage
// shows "—" with the coverage; plants prove the check bites. Criterion 4: India-only parts are absent in the US.
import { fixtureOverviewData as overview } from "../../../lib/overview/fixture-source.ts";
import { moversQuery, readMarketsState } from "../../../lib/overview/state.ts";
import { fixtureScreenerData as screener } from "../../../lib/screener/fixture-source.ts";
import { INDEX_OPTIONS } from "../../../lib/screener/screens.ts";
import { NoExample } from "../../../lib/ui/no-example.ts";
import { figureChecks, unsourced } from "./sourced.mjs";

async function blocksOf(page, market) {
  const state = readMarketsState(Object.fromEntries(new URL(page.url()).searchParams));
  const india = market === "india";
  const movers = await screener.stocks(market, moversQuery(state, market)).catch((e) => (e instanceof NoExample ? undefined : Promise.reject(e)));
  const blocks = {
    indices: await overview.indices(market),
    sectors: india ? await overview.indiaSectors() : await overview.usSectors(),
    summary: await screener.summary(market),
    movers,
    world: await overview.world(market),
    ...(india ? { flows: await overview.flows(), fnoRows: await screener.fnoRows({ symbols: INDEX_OPTIONS, sort: "oi", page: 1, page_size: 25 }) } : { rates: await overview.rates() }),
  };
  return { state, blocks };
}

/** Plants: the judges' kinds of sum. India: a day's FII + DII under the FII field, and the five days added up under an
 *  incomplete period's total; the US: two companies' closes added under one. Plus a breadth count of another universe. */
function plants(blocks, market) {
  const u = blocks.summary.universes;
  if (market !== "india") {
    const r = blocks.movers.rows;
    return [{ why: "two movers' closes added up under one", src: "movers:rows[0].p", text: (r[0].p + r[1].p).toFixed(2) }, { why: "a breadth count that is not the field", src: "summary:universes.ours.up", text: String(u.ours.up + 1) }];
  }
  const d = blocks.flows.days[0];
  const fiveDays = blocks.flows.days.reduce((a, x) => a + x.fii.net, 0);
  return [
    { why: "a day's FII + DII under the FII field", src: "flows:days[0].fii.net", text: `₹${Math.round(d.fii.net + d.dii.net)} cr` },
    { why: "the days added up under a period total the publisher leaves empty", src: "flows:totals.m1.fii", text: `₹${Math.round(Math.abs(fiveDays))}` },
    { why: "the Nifty 500's count under all NSE", src: "summary:universes.all.up", text: u.n500.up.toLocaleString("en-IN") },
  ];
}

export async function marketsChecks(page, { market }) {
  const { state, blocks } = await blocksOf(page, market);
  const problems = await figureChecks(page, ".markets", blocks, plants(blocks, market));
  for (const sel of ['[aria-label="Movers"] .list li .r:first-of-type', '[aria-label="Sectors"] .mb-heat-tile b', '[aria-label="Indices"] .list li .r', '[aria-label="World"] .mb-heat-tile b'])
    for (const t of await unsourced(page, sel)) problems.push(`figure without a source (${sel}): ${t}`);
  if (market === "india") {
    for (const t of await unsourced(page, '[aria-label="Institutional flows"] .mb-flowbar')) problems.push(`flow without a source: ${t}`);
    const total = blocks.flows.totals[state.per];
    const text = await page.$eval('[aria-label="Institutional flows"]', (n) => n.innerText);
    if (!total.complete && !text.includes(`— (only ${total.days} days of data for ${total.days_in_period} sessions)`)) problems.push(`the ${state.per} flows total is incomplete but the page does not show "—" with the coverage`);
  }
  return problems;
}

/** The US: no flows, India VIX, index options, F&O or NSE element; no India-only block read (absent, not empty). */
export async function usMarketsChecks(page, ctx) {
  const problems = await marketsChecks(page, ctx);
  for (const label of ["Institutional flows", "India VIX", "Index options"]) if (await page.$(`.markets [aria-label="${label}"]`)) problems.push(`the India-only part "${label}" is on the US page`);
  if (await page.$('.markets [data-src^="flows"], .markets [data-src^="fnoRows"]')) problems.push("an India-only figure on the US page");
  if (/F&O|NSE|Nifty|₹/.test(await page.$eval(".markets", (n) => n.innerText))) problems.push("an India-only word (F&O, NSE, Nifty, ₹) on the US page");
  return problems;
}
