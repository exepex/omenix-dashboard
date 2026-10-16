# Response 43: the 2.11.0 follow-up for W3f and W3g (claims for the judge)

Branch `story/w3-cap-bars`, from the integration branch `story/w3-merge-gh` at 9e99b89 (main e425aea, contract 2.11.0,
plus W3f, W3g and W3h as judged). One judged change, as the orchestrator asked. Builder session 0134MoC6.

## What changes

- **Today's card (W3f):** the "most it can lose" line becomes mockup 39's bar against `trade.max_loss_cap`. It reads,
  for example, "The most it can lose: ₹3,984, charges included", with the bar at 39.8% and the note "40% of the
  ₹10,000 a trade may lose. Fixed at entry: no stop-loss order is needed." Both numbers are the payload's. The
  contract type gains `max_loss_cap`; the position view returns words, bar, aria and note; the component draws a
  `.cap` bar.
- **AI usage and budget (W3g):** mockup 43's wording and alert mark, from `share_pct`, `alert_pct` and `stop_pct`:
  - "Cap 920 min, 50% of 1,840 min measured";
  - a tick at `alert_pct` on the bar (at the bar's end if past it);
  - "At 80% an alert goes out; at 100% the AI roles stop";
  - the how-to "may use at most 50% of the basis".

  The contract type gains the three fields.
- **Shared CSS:** the budget's `.cap .bar .tick` has the same rule body as the weather's `.chance .base` (the usual
  chance mark). Both now share one rule in fno-screen.css, and weather.css no longer has its own copy.

## Tests (no copy of an owner number in the screen)

- Card: the example's cap gives 39.8% and 40%. A different cap (₹5,000) moves the bar and the words (79.7%, "80% of
  the ₹5,000 cap").
- Budget: the examples' shares give the words above. Different shares (40, 70, 90) change the note, the tick and the
  words, and an alert share past the cap is drawn at the bar's end.
- Changed test: the old "no 80%, 50% or half in the words" check could not stay, because the words now say the
  payload's 80% and 50%. It became two checks:
  - the words follow the payload, as above;
  - a scan of the budget screen's code finds no literal 50%, 80% or 100% and no "half", and a planted "At 80%" is
    caught.

  The no-money and no-model checks are unchanged. This is a change of what the test guards, not a loosening: the rule
  was always "no copy of BG1's numbers in the screen", and the scan now guards exactly that.

## Gates on this tree

- check_code_size, check_contract (2.11's copied-figure check included), check_fno_screens and the design copies pass.
- typecheck passes; `npm test` 571/571 with 0 skipped; build passes.
- A sweep of all nine F&O pages at 1280 and 390 px shows no overflow and no console errors; a budget screenshot shows
  the tick at 80%.
- Not drawn in a screenshot: the card's default example is the NO TRADE case, which has no position, so the card's
  bar shows only on the TRADE and WATCH examples, which the view tests cover.
