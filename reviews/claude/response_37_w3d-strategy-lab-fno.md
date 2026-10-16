# Response 37: story W3d, the Strategy lab's F&O tab (builder's claims)

Builder: Claude (session 0134MoC6). Story text: exepex/trading `docs/stories/W3-fno-screens.md`, W3d. Branch
`story/w3d-strategy-lab-fno`, from main ea8a359.
- **Contract:** 2.7.0's `FnoStrategyLab`, unchanged in 2.8.0 (checked).
- **Reference:** mockup 45-strategy-lab-fno, on story/fno-2-8-merge (judge 217 add. 1 PASS), which supersedes 38's
  F&O part.

## What it does

- **Route:** `/india/strategy-lab/fno` (route `lab-fno`, outside the navigation). It is reached from a Stocks / F&O tab
  bar on both lab pages.
  - In the US there is no tab bar, and `/us/strategy-lab/fno` is a real 404 (built for India alone).
  - The stock lab's own code is untouched: the tab bar is added in its server `page.tsx` only.
- **Content, from mockup 45:**
  - the headline (whether any strategy passed);
  - every idea tried, with the passes chance alone would give, and each idea's status and evidence label (never its
    rules);
  - what each book may trade, and why not, with its AI and data costs at book level;
  - the paper results after every cost: Paper; each strategy its own line, never added across books; signed, with
    glyph and word;
  - the real-money checks: always "Not eligible" here, each check met, not met, or not checked yet.
- **Pattern:** the same as W3a and W3b.
  - `lib/fno-strategy-lab/`: contract, source, Azure page `strategy_lab`, fixture, wiring, `view.ts`;
  - `components/fno-strategy-lab/`.
  - Books use the frame's `ApBadge`. Example shows only through the frame's rule.
- **Shared CSS moved into `components/fno-common/fno-screen.css`:** the verdict band, the chips and the mark list.
  Otherwise the duplicates test would refuse a second copy. The weather and Forecast lab CSS lose those copies;
  `.verdicts` is renamed `.marks`. Both screens re-checked: no console error, no overflow.

## Not built here (stated)

- **The "both books together: total only" line:** the owner's 13 Oct choice (a), one total per family across stocks
  and F&O, India only. Mockup 45's notes put it on 38's page as "the web screen's work". It needs the stock page's
  per-family totals beside F&O's, and the stock lab is another builder's (B16) client page. This is a separate small
  story, to agree with its owner, not folded in silently.

## Evidence

- check_code_size and the design copies: clean.
- `npm test`: 500 passed, 0 failed, 0 skipped. That includes 6 new tests (headline, factory, books, results, real
  money, routes), the screens-wide import graph, the gateway rule and the real-PostgreSQL integration test with page
  `strategy_lab`.
- Build: clean. `next start` without a database:
  - `/india/strategy-lab/fno` answers 200 and `/us/strategy-lab/fno` 404;
  - the stock lab is 200 in both markets, with the tab bar in India only;
  - no console error and no overflow at 1280 and 390 on the F&O tab, the weather and the Forecast lab.
- **On the stock lab:** its CSS preload warnings and its "HTTP 503" (the stock API has no backend here) are the same on
  clean main. I checked with a separate build of main. They are not from this change.
