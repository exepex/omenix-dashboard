# Response 32 · W14 round 3: the owner's four Strategy lab findings after deploying 8893f17

All four are fixed. Evidence: unit tests, UI harness cases (219 before this round's two new cases, all passing),
mutation checks, and screenshots in `w14/round3-*.png`.

## 1. Strategy names leaked internals: neutral labels and ids everywhere (strong evidence)

**Root cause.** The backend's names ("Model + news, 60% bar", "Model + news, calm markets only") and its ids
("rule.model_news_calm.v1") state each strategy's settings. Round 2's allow-list passed `name` and `id` through.

**Fix.** `web/lib/ui/strategy-labels.ts` holds one fixed table, keyed by backend id, in the dashboard (the stock repo is
read-only):
- Rule-based 1–8 (`rule-1`…`rule-8`);
- Always buy (`base-1`), Follow yesterday (`base-2`), Baseline 3 (`base-3`, was "Model without news");
- AI team A–D (`ai-a`…`ai-d`).

The table is stable: a page with two strategies shows the same labels as the page with all of them. A strategy the
table does not know yet gets a neutral label from a hash of its id, never its name: "Rule-based (new 3f9a)", with
public id `rule-3f9a`.

**Where it is applied.** The one naming rule (`strategy-names.ts`) uses the table. It is applied:
- **on the server, in every `/api/v1` page answer** (`lib/data/handler.ts`), so no API answer carries a backend name
  or id;
- in the client read path and the frame's and Home's adapters, as before.

**What it replaces.** Names in fields, names in sentences (also names without an id, such as the search list), ids in
map keys and record ids, and URL hashes (`#rule-1`, `#story=ai-a:…`). Links between pages keep working because every
page maps the same way. Fixed texts that named "Model without news" (Help, Strategy lab tip, portfolios family note)
now say Baseline 3.

**Tests:**
- unit tests: every label and public id is free of settings words (news, bar, %, calm, regime, global, model, …), for
  the 15 strategies and three planted new ids;
- after the rule, no fixture keeps a backend name or id;
- labels are fixed across pages;
- applying the rule twice changes nothing (it runs on both the API and the client).

**Mutation checks**, each caught by 2 tests:
- one label reverted to its backend name;
- a public id equal to the backend id;
- an unknown strategy shown by its backend id.

**UI harness:** `w14-no-backend-names-*` scans the HTML and the address of Home (India, US), Strategy lab, Help, Rule vs
AI, Paper portfolios, the stock page, Stock strategies and Track record. On the first run it found "Model without
news" in fixed page text; that is now fixed.

**Still open (some evidence):**
- The signed-off mockups keep the backend names in their own data. They are design references; changing them needs
  the same table in the Python builders.
- The trade story still shows a strategy's chance bar ("its bar: 55%"), through the lifecycle endpoint.
- The MCP and Slack tools read MotherDuck separately; not checked.

## 2. Heatmap "By company": labels ran into each other, values were cut off (strong evidence)

**Root cause:** a fixed-layout table squeezed every company into the card's width, and cells hid their overflow.

**Fix.** The map now sits in the design system's `.md-table-wrap` and scrolls sideways inside its card:
- every column keeps at least 60 px, enough for the full signed value ("−8.23L");
- the strategy names stay pinned on the left;
- a header too long for its column ends in "…", with the full name as its tooltip.

**Tests:** `w14-lab-heatmap` (fixture) and `w14-lab-heatmap-14-companies` (14 companies, ±₹8.2 lakh values, as in
your screenshot), at 1280 and 390 px. They fail on a cut-off value, an overflowing label without "…", a label without
its full name, or a map that does not scroll in its card. Screenshots: `w14/round3-heatmap-by-company-1280.png` and
`-390.png`.

## 3. Drawdown limit ₹10,00,000: correct, labelled as the stock tool's proposal (strong evidence)

The stock tool computes it in `scripts/marketbrief/lab/scoreboard.py`:

```
limit = DRAWDOWN_LIMIT_AMOUNTS * DEFAULT_AMOUNT[market]
```

- `lab/constants.py` says `DRAWDOWN_LIMIT_AMOUNTS = 10  # max drawdown proposal: 10 x the market's default amount`.
- So the limit is 10 × ₹1,00,000 = ₹10,00,000 in India, and 10 × $1,000 = $10,000 in the US.
- It is in rupees, not paise; there is no units bug. I checked it in a read-only clone; no stock data was changed.

**The page now says:** "proposed limit: the paper profit may fall at most ₹10,00,000 below its best point". It shows
"limit not available" when the value is missing or not positive (`drawdownLimitWords`, `lab-detail.tsx`).

## 4. Picks panel: "Picked to buy … No: below costs" (done)

One line now says what the strategy picked and why it is or is not a buy:
- "**Not a buy after costs:** AI team sees a 60.5% chance of a rise over 5 days, but the costs are larger than the
  expected gain."
- or "**Worth a paper buy:** … and the expected gain beats the costs."

The label below reads "Expected −1.09% after costs", with the ✕ or ✓ icon and the colour. The same change is in the
mockups' picks script (`_platform/js/3-picks.js`); the signed-off mockups were rebuilt. Screenshot:
`w14/round3-picks-panel-wording.png`.

## Checks run

- code size, typecheck, 452 unit tests and the build: pass;
- UI harness, all cases: **219 cases, 0 failed**, then the two heatmap cases: **2 of 2 passed**;
- the 7 rebuilt signed-off mockups: `check_page` finds no console errors, no external requests and no overflow;
  `check_text` finds 0.

## Addendum: "By company" redesigned (the owner: "wrong format, data overlap over each other, not a good design")

**I agree with the owner, and the round-3 fix above was a patch.** Sideways scrolling kept a layout that can never fit
about 20 companies as columns. This addendum is on branch `story/w14-round3`, for the judge before `main` (owner's
rule of 14 Oct).

**The design now** (`lab-company-map.tsx`):
- **Rows and columns:** companies are rows, with their full names and tickers. Strategies are columns: as many as the
  card's width holds with every value whole (220 px for names, 92 px per column), the chosen strategy first, then the
  scoreboard's order.
- **Values:** every cell shows its full signed value (₹ with k, L or Cr).
- **Sorting:** "Sort by" picks the strategy; "Worst first" or "Best first" orders the rows by its result.
- **Length:** the first 8 companies show, then "Show all N companies"; the card grows only downwards. A line says how
  many strategies fit, and how to see another.
- **Layout:** full width, under By horizon and By market regime.
- **Phone (390 px):** one strategy column; the "Sort by" selector switches it.

**Test** (`w14-lab-company-map-25`, at 1280 and 390 px): 25 companies with long names (ULTRACEMCO, BAJAJFINSV,
HINDUNILVR, "Oil and Natural Gas Corporation Limited", …) and six-figure results. It fails on:
- any two texts whose boxes overlap;
- any clipped value or label;
- any element past the card's right edge, or a card that scrolls sideways;
- anything other than 8 rows at first and 25 after "Show all";
- not worst first;
- more than one column on a phone, or fewer than 3 at 1280 px.

**Mutation check:** with 40 px columns, the test fails ("clipped texts: −7.92L, …").

Screenshots: `w14/round3-company-map-1280.png` and `-390.png`. The earlier `round3-heatmap-by-company-*.png` show the
superseded scroll version.
