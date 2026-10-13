// The app frame's checks on the running app (story W8), used by cases/frame.mjs. Each returns a list of problems.
// The clock is the fixture's (Wed 7 Oct 2026 17:30 IST: India closed); "#clock=open" is the labelled example clock.

const TRADE = "[data-trade]";
const LOCK = /^Market closed: you can buy and sell again when it opens/;

/** The page sits inside the frame: app bar, market chip, one search box, the page in the frame's main area. */
export async function frameChecks(page, { width, market }) {
  const problems = [];
  for (const sel of [".mb-pf > .mb-appbar", ".mb-pf .mb-mkt", ".mb-pf-main#mb-main .mb-pf-inner > *", ".mb-pf .mb-gsearch"]) if (!(await page.$(sel))) problems.push(`no ${sel}`);
  const searchBoxes = await page.$$eval(".mb-gsearch", (n) => n.filter((x) => x.offsetParent !== null).length);
  if (searchBoxes !== 1) problems.push(`${searchBoxes} visible search boxes, not 1`);
  const visible = (sel) => page.$eval(sel, (n) => getComputedStyle(n).display !== "none").catch(() => false);
  if (width >= 600 && !(await visible(".mb-navrail"))) problems.push("no navigation rail at this width");
  if (width < 600 && !(await visible(".mb-navbar"))) problems.push("no phone tabs at this width");
  // A page that needs the width starts with the panel hidden (33 and 34, signed off); then the app bar must offer it.
  const hiddenByPage = await page.$(".mb-pf.wl-off");
  if (width >= 1200 && hiddenByPage && !(await page.$('.mb-appbar [aria-label="Show today’s picks"]'))) problems.push("the picks panel is hidden and the app bar does not offer it");
  if (width >= 1200 && !hiddenByPage && !(await visible(".mb-wl"))) problems.push("no picks panel at this width");
  if (market === "us" && (await page.$$eval(".mb-pf .mb-appbar, .mb-pf .mb-navrail, .mb-pf .mb-wl", (n) => n.some((x) => /F&O|Option chain/.test(x.textContent))))) problems.push("an F&O element in the US frame");
  return problems;
}

/** AC3 in the app: by name, by ticker, by NSE option code (typed after "/"). */
export async function searchChecks(page) {
  const problems = [];
  const query = async (q) => {
    await page.keyboard.press("Escape");
    await page.keyboard.press("/");
    await page.fill(".mb-modal.palette input", q);
    return page.$$eval(".mb-modal.palette .mb-pal-item b", (b) => b.map((x) => x.textContent));
  };
  if (!(await query("reliance industries")).includes("RELIANCE")) problems.push("name search missed RELIANCE");
  if (!(await query("HDFCBANK")).includes("HDFCBANK")) problems.push("ticker search missed HDFCBANK");
  const code = await query("NIFTY26OCT22800CE");
  if (code[0] !== "NIFTY 27 OCT 22800 CE") problems.push(`code search gave ${code.join(", ")}`);
  const groups = await page.$$eval(".mb-modal.palette .mb-pal-group", (g) => g.map((x) => x.textContent));
  if (!groups.includes("F&O contracts")) problems.push(`code result groups: ${groups.join(", ")}`);
  if ((await page.$$(".mb-modal.palette .mb-pal-item .mb-bs.buy")).length < 1) problems.push("the option result has no B");
  return problems;
}

/** The US: F&O absent everywhere in the frame; search for an option code finds nothing and says F&O is India only. */
export async function usChecks(page, ctx) {
  const problems = await frameChecks(page, { ...ctx, market: "us" });
  const chip = await page.textContent(".mb-mkt");
  if (!/Closed/.test(chip ?? "")) problems.push(`US chip reads ${chip}`);
  await page.keyboard.press("/");
  await page.fill(".mb-modal.palette input", "NIFTY26OCT22800CE");
  const text = await page.textContent(".mb-modal.palette");
  if ((await page.$$(".mb-modal.palette .mb-pal-item")).length) problems.push("the US search found an item for an NSE option code");
  if (!/F&O is India only/.test(text ?? "")) problems.push("the US search did not say F&O is India only");
  await page.fill(".mb-modal.palette input", "nifty");
  if (await page.$(".mb-modal.palette .mb-pal-group:has-text('F&O')")) problems.push("an F&O group in the US search");
  return problems;
}

async function tradeStates(page, scope) {
  return page.$$eval(`${scope} ${TRADE}`, (b) => b.map((x) => ({ disabled: x.disabled, label: x.getAttribute("aria-label") ?? "", side: x.dataset.trade, cls: x.className })));
}

const allLocked = (states, where, problems) => {
  if (!states.length) problems.push(`no Buy or Sell in ${where}`);
  for (const s of states) if (!s.disabled || !/: Market closed: you can buy and sell again when it opens/.test(s.label)) problems.push(`${where}: ${s.label || s.side} not locked with the reason`);
  for (const s of states) if (!s.cls.includes(s.side)) problems.push(`${where}: ${s.side} button without its colour class`);
};

/** AC4: closed market. Picks, search results, hover card (desktop) or quick view, keyboard B, order window. */
export async function lockChecks(page, { width }) {
  const problems = [];
  if (width < 600) await page.click('.mb-navbar a:has-text("Picks")');
  allLocked(await tradeStates(page, ".mb-wl"), "picks", problems);
  const tip = await page.getAttribute(".mb-wl .act", "data-tip");
  if (!LOCK.test(tip ?? "")) problems.push(`picks row tooltip: ${tip}`);
  if (width < 600) await page.click('.mb-wl button[aria-label="Close the picks"]');
  await page.keyboard.press("/");
  await page.fill(".mb-modal.palette input", "reliance");
  allLocked(await tradeStates(page, ".mb-modal.palette"), "search results", problems);
  await page.keyboard.press("Escape");
  if (width >= 1200) {
    await page.hover(".mb-wl .tk[data-inst='RELIANCE']");
    await page.waitForSelector(".mb-hcard.on", { timeout: 3000 }).catch(() => problems.push("no hover card"));
    allLocked(await tradeStates(page, ".mb-hcard"), "hover card", problems);
    await page.keyboard.press("Escape");
    await page.focus(".mb-wl .mb-sig-row");
    await page.keyboard.press("b");
    const snack = await page.textContent(".mb-snack.on").catch(() => "");
    if (!LOCK.test(snack ?? "")) problems.push(`keyboard B while closed: ${snack}`);
    if (await page.$(".mb-drawer.open")) problems.push("keyboard B opened the order window while closed");
  } else {
    await page.evaluate(() => { location.hash = "drawer=quick:RELIANCE"; });
    await page.waitForSelector(".mb-drawer.open");
    allLocked(await tradeStates(page, ".mb-drawer"), "quick view", problems);
  }
  await page.evaluate(() => { location.hash = "drawer=order:RELIANCE:buy"; });
  await page.waitForSelector(".mb-drawer.open .mb-checks");
  const first = await page.textContent(".mb-drawer .mb-checks li:first-child");
  if (!/^Market open failed/.test(first ?? "")) problems.push(`order window first check: ${first}`);
  const foot = await page.$eval(".mb-drawer [data-submit='none']", (b) => ({ disabled: b.disabled, text: b.textContent }));
  if (!foot.disabled || foot.text !== "Market closed") problems.push(`order window foot: ${JSON.stringify(foot)}`);
  return problems;
}

/** The labelled example clock during the session: the same controls are enabled, Buy green and Sell red. */
export async function openChecks(page, { width }) {
  const problems = [];
  const chip = await page.textContent(".mb-mkt");
  if (!/Open/.test(chip ?? "") || !/closes 15:30 IST/.test(await page.getAttribute(".mb-mkt", "data-tip") ?? "")) problems.push(`open chip: ${chip}`);
  if (width < 600) await page.click('.mb-navbar a:has-text("Picks")');
  const states = await tradeStates(page, ".mb-wl");
  if (!states.length || states.some((s) => s.disabled)) problems.push(`picks while open: ${JSON.stringify(states)}`);
  const colours = await page.$$eval(".mb-wl [data-trade]", (b) => b.map((x) => [x.dataset.trade, getComputedStyle(x).backgroundColor]));
  const bg = (side) => [...new Set(colours.filter(([s]) => s === side).map(([, c]) => c))];
  if (bg("buy").length !== 1 || bg("sell").length !== 1 || bg("buy")[0] === bg("sell")[0]) problems.push(`Buy and Sell colours: ${JSON.stringify(colours)}`);
  return problems;
}

/** AC6 in the app: estimates labelled, the fill basis named, refusal and limit block, no request leaves on any action. */
export async function orderChecks(page) {
  const problems = [];
  const sent = [];
  page.on("request", (r) => { if (r.method() !== "GET") sent.push(`${r.method()} ${r.url()}`); });
  const open = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForSelector(".mb-drawer.open .mb-checks"); };
  await open("clock=open&drawer=order:RELIANCE:buy");
  const sum = await page.textContent(".mb-drawer .mb-order-sum");
  for (const w of ["Order value (estimate)", "Charges (estimate)", "Cash after (estimate)", "Last price, 6 Oct close"]) if (!sum?.includes(w)) problems.push(`stock order summary lacks "${w}"`);
  const basis = await page.textContent(".mb-drawer [data-fill='basis']");
  if (!/Estimates use the 6 Oct close price\. The fill would use the stock tool's next price check/.test(basis ?? "")) problems.push(`fill basis: ${basis}`);
  await page.fill("#o-qty", "25");
  if (!(await page.textContent(".mb-drawer .mb-order-sum"))?.includes("25")) problems.push("quantity did not update the estimate");
  const foot = await page.$eval(".mb-drawer [data-submit='none']", (b) => ({ disabled: b.disabled, text: b.textContent }));
  if (!foot.disabled || foot.text !== "Preview only") problems.push(`passing order foot: ${JSON.stringify(foot)}`);
  await page.click(".mb-drawer [data-submit='none']", { force: true }).catch(() => {});
  await open("clock=open&drawer=order:NIFTY26OCT23300CE:buy");
  if (!/3 pm snapshot/.test((await page.textContent(".mb-drawer .mb-order-sum")) ?? "")) problems.push("option order does not name the 3 pm snapshot");
  await open("clock=open&drawer=order:NIFTY26OCTFUT:buy");
  if (!(await page.$(".mb-drawer .mb-alert.danger:has-text('Refused: no executable quote')"))) problems.push("a future was not refused");
  await open("clock=open&drawer=order:NIFTY26OCT22800CE:sell");
  if (!(await page.$(".mb-drawer .mb-checks li.fail:has-text('unlimited: a single short option')"))) problems.push("a single short call was not blocked");
  if (sent.length) problems.push(`requests sent from the order window: ${sent.join(" | ")}`);
  return problems;
}
