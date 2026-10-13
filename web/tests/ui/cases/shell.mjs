// UI cases of the shell and shared components (B7). A case: {name, path, market?, widths?, mockup?, initScript?, expectText?,
// expectSelector?, waitFor?, status?, apiStatus?, api?, routes? ({path: async (request) => ({status, body})} for
// same-origin routes outside /api/v1, e.g. /api/assistant), keyboard?, allowConsole? (regexes of expected console
// messages, e.g. the browser's own line for a 503 the case asked for), check?(page, {width, market}) -> string[]}.
// Page sessions add their own file here (cases/<page>.mjs) with their page's cases at the mockup's widths.

const PAPER = "Not proven yet: these are tests, not tips.";
const HTTP_ERROR_LINE = /^Failed to load resource: the server responded with a status of (404|503)/;

/** The frame's own checks on any page (W8): one current rail group, the market switch pressed on the market, Paper visible. */
async function shellChecks(page, { market }) {
  const problems = [];
  const pressed = await page.$$eval('[aria-label="Market"] button[aria-pressed="true"]', (b) => b.map((x) => x.textContent));
  if (pressed.length !== 1 || pressed[0] !== (market === "us" ? "US" : "India")) problems.push(`market switch pressed: ${pressed.join(",")}`);
  const current = await page.$$eval('.mb-navrail .mb-rail-item[aria-current="page"]', (a) => a.length);
  if (current !== 1) problems.push(`rail has ${current} current groups`);
  const paper = await page.$$eval(".mb-tag.paper", (t) => t.length);
  if (!paper) problems.push("no Paper tag on the page");
  return problems;
}

/** Home (W9) says Paper in its words, as the signed-off 31-dashboard does ("Your paper account", "Open paper trades",
 *  "total paper profit or loss"), rather than with a tag; the frame's checks otherwise apply. */
async function homeShellChecks(page, ctx) {
  const problems = (await shellChecks(page, ctx)).filter((p) => p !== "no Paper tag on the page");
  const text = await page.$eval(".home", (n) => n.innerText);
  for (const w of ["Your paper account", "Open paper trades", "total paper profit or loss"]) if (!text.includes(w)) problems.push(`Home does not say "${w}"`);
  return problems;
}

export const cases = [
  { name: "shell-home-india", path: "/india", widths: [1280, 1024, 768, 390], waitFor: ".home .mb-apcard", expectText: ["Who trades, and how it is going"], check: homeShellChecks },
  { name: "shell-home-us", path: "/us", market: "us", widths: [1280], waitFor: ".home .mb-apcard", expectText: ["Who trades, and how it is going"], check: homeShellChecks },
  { name: "shell-watchlist", path: "/india/watchlist", mockup: "02-watchlist", waitFor: ".phead", expectText: [PAPER, "Watchlist"], check: shellChecks },
  { name: "shell-company", path: "/india/stocks/RELIANCE", mockup: "03-company", waitFor: ".phead", expectText: ["RELIANCE"], check: shellChecks },
  { name: "state-error-503", path: "/india/watchlist", apiStatus: 503, allowConsole: [HTTP_ERROR_LINE], widths: [1280, 390], waitFor: '[role="alert"]', expectText: ["Data service unavailable", "Try again", "omenix.vercel.app/india"] },
  { name: "state-loading", path: "/india/news", apiStatus: "slow", widths: [1280], waitFor: '[aria-busy="true"]', expectText: ["Loading the page data"] },
  { name: "state-bad-ticker", path: "/india/stocks/not-a-ticker", widths: [1280], waitFor: '[role="alert"]', expectText: ["Not found"] },
  { name: "unknown-market-404", path: "/mars", status: 404, allowConsole: [HTTP_ERROR_LINE], widths: [1280], keyboard: false, expectText: ["Page not found"] },
  {
    name: "gallery",
    path: "/india/gallery",
    widths: [1280, 390],
    waitFor: ".mb-candles canvas",
    expectText: ["Component gallery", "after your broker’s fees"],
    check: async (page) => {
      const problems = [];
      if (await page.$('.mb-navrail .mb-rail-item[aria-current="page"]')) problems.push("the gallery marks a rail group as current");
      const failed = await page.$(".mb-candles .quiet");
      if (failed) problems.push("the vendored chart did not draw");
      const hit = page.locator(".mb-chart rect.hit").first();
      await hit.focus();
      if (!(await page.$eval("#tip", (t) => t.classList.contains("on") && t.textContent.includes("Rule")))) problems.push("focusing a line-chart column did not show its values");
      await page.click('th button.sort:has-text("Move")');
      const sort = await page.getAttribute('th:has(button:has-text("Move"))', "aria-sort");
      if (sort !== "descending") problems.push(`sort by Move gave aria-sort=${sort}`);
      const first = await page.locator("table[aria-label='Sample table'] tbody tr td").first().textContent();
      if (first !== "Alpha") problems.push(`descending sort put ${first} first`);
      await page.click('.pager button:has-text("Next")');
      if (!(await page.$('.pager button[aria-current="page"]:has-text("2")'))) problems.push("Next did not move the pager to page 2");
      return problems;
    },
  },
  {
    // The CI runner's POSIX locale reaches the browser as navigator.language "en-US@posix", a tag Intl refuses; the
    // chart must format in the market's locale, never the viewer's (components/charts/candles.tsx).
    name: "gallery-posix-locale",
    path: "/india/gallery",
    widths: [1280],
    waitFor: ".mb-candles canvas",
    keyboard: false,
    initScript: () => Object.defineProperty(Navigator.prototype, "language", { get: () => "en-US@posix" }),
  },
  {
    name: "phone-tab-order",
    path: "/india",
    widths: [390],
    waitFor: ".home .mb-apcard",
    keyboard: false,
    check: async (page) => {
      const problems = [];
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("Tab");
        if (await page.evaluate(() => !!document.activeElement?.closest(".mb-navrail, .mb-drawer:not(.open), .mb-wl"))) problems.push(`Tab stop ${i + 1} is inside a hidden part of the frame`);
      }
      return problems;
    },
  },
  {
    name: "market-switch",
    path: "/india/watchlist",
    widths: [1280],
    waitFor: ".phead",
    check: async (page) => {
      await page.click('[aria-label="Market"] button:has-text("US")');
      await page.waitForURL("**/us/watchlist");
      const switched = [];
      await page.goto(page.url().replace("/us/watchlist", "/india/stocks/RELIANCE"));
      await page.click('[aria-label="Market"] button:has-text("US")');
      await page.waitForURL("**/us/watchlist").catch(() => switched.push(`stock page switched to ${page.url()}, not the US watchlist`));
      return switched;
    },
  },
  {
    name: "phone-drawer",
    path: "/india",
    widths: [390],
    waitFor: ".home .mb-apcard",
    check: async (page) => {
      const problems = [];
      await page.click('.mb-navbar a:has-text("More")');
      if (!(await page.$(".mb-drawer.open:has-text('All screens')"))) problems.push("More did not open the drawer with every screen");
      await page.keyboard.press("Escape");
      if (await page.$(".mb-drawer.open")) problems.push("Escape did not close the drawer");
      return problems;
    },
  },
  {
    name: "tooltip-keyboard",
    path: "/india",
    widths: [1280],
    waitFor: ".home .mb-apcard",
    check: async (page) => {
      await page.focus(".home .mb-mband a");
      const shown = await page.$eval("#tip", (t) => t.classList.contains("on") && t.textContent.length > 0);
      return shown ? [] : ["focusing an index with data-tip did not show the tooltip"];
    },
  },
];
