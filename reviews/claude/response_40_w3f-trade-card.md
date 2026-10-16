# Response 40: story W3f, today's card screen (claims for the judge)

Branch `story/w3f-trade-card`, from main f4f7f40 (contract 2.10.0). Mockup `design/mockups/39-trade-card`, contract
`FnoCard` (page `card`). Builder session 0134MoC6.

## What it adds

- **Data, the W12 pattern:** `lib/fno-card/` has:
  - the contract types and one interface (`CardData.card()`);
  - the Azure adapter (page `card`);
  - the fixture adapter, with P1's five examples. The empty case is the default, as in mockup 39: it is the shape of
    today's real state;
  - one wiring, with `cardLive`;
  - four pure views, split by purpose: `view.ts` (the top), `position-view.ts`, `why-view.ts` and `record-view.ts`.

  `FNO_PAGES.getFnoCard = "card"` is removed from the not-read list and added to the integration test's page record.
- **Page:** `/india/card`, India only (the US is a 404). It has the route `card` (mockup 39, endpoint fno/card) and the
  nav item "Today's card" in India's Strategies group (story W3 answer (a)). Mockup 39's runtime puts the card under
  'trade'; I followed the story, and asked the screens lead.
- **What it shows, as mockup 39:**
  - the TEST note;
  - the verdict (TRADE, NO TRADE, WATCH) with glyph, word, session, valid-until time and reason;
  - the three times in order, plus the delivery (with "Alert NOT sent");
  - the position, owner only: legs, the entry range drawn on its scale with the stop end, size, the most it can lose,
    worst stretches, exits, what would prove it wrong, costs and tax, and the volatility edge;
  - the weather, and the forecast with its live and back-fill records stated apart;
  - the devil's advocate, which never invents an objection when it did not answer;
  - the data checks with each missing input named, and the rungs. Real money is always "not eligible";
  - paper trades so far, as counts per book, with money never added;
  - the overnight stress line (owner only), the price of staying out (NO TRADE only), the gaps and earlier misses;
  - if you cannot act, the record hashes, and every forecast on record (a late capture is marked "not scored").

## Rules and choices

- **The per-trade loss cap is not copied into the screen.** Mockup 39 hard-codes `CAP = 10000`, but the contract
  sends no cap. The screen therefore says "The most it can lose: ₹3,984, charges included" without the cap bar, as W3c
  did before `open_risk_cap` existed. I asked the screens lead for a `trade.max_loss_cap` field; the bar comes with it.
- **Owner-only fields** (the position, the stress line, the objections) carry the "Owner only" mark. They show only on
  the signed-in dashboard; the gateway import test covers every new module and still passes.
- **Shared CSS, caught by the duplicate test:**
  - `.facts3` and `.chance` moved from weather.css to fno-screen.css; the card uses both. Weather's own `.chance .base`
    tick stays in weather.css;
  - the code-chip rule moved to fno-screen.css as `.legs code, .hashes code` (paper books' legs and the card's hashes);
  - I added `.muted` to fno-screen.css. No global `.muted` rule existed, so every F&O screen's muted text had none
    until now.

  Screenshots of the weather, paper books and card pages show no layout change apart from the intended muted colour.
- **The weather's colour label** is reused from `lib/fno-weather/view.ts` (glyph and word); the card says "No
  weather" where the weather screen says "No colour".

## Tests

- `lib/fno-card/tests/card.test.ts`: the verdict, TEST, the times (sent and not sent), the position, a credit entry,
  WATCH, and NO TRADE having no position.
- `lib/fno-card/tests/why.test.ts`: the weather, the forecast records, the advocate, the checks, the rungs, the price
  of staying out (all statuses, including a measured cost and saving), trades so far, stress bars, a late capture,
  misses and hashes.
- `lib/fno-card/tests/route.test.ts`: the nav and the route.

All expected values are the examples' own numbers, written by hand.

## Gates on this tree

- check_code_size, check_contract, check_fno_screens and the design copies pass; typecheck passes; `npm test`
  539/539 with 0 skipped; build passes.
- Screenshots at 1280 and 390 px of the card and the weather page show no horizontal overflow and no console errors.
  `/us/card` gives 404.

## Addendum 1: judge 234's should-fix (no fixed card time)

Accepted after checking the sources. Trading's T-cards.md:179 says the card at about 15:08 is earlier than both the
decisions (15:12) and C3's check (15:15), "So T2 never assumes a time"; E8:52-56 says O1 posts after `quotes_done`,
"so T is 15:15 or later". With the card valid until 15:25, "about 15:08" would suggest about 17 minutes to act when
there are about 10 or fewer, so the old wording was wrong in a way that matters.

- The lede now says "after the day’s decisions are final", and the source tip says the same. The payload's own three
  times, already shown, carry the real time.
- A new test, `lib/fno-card/tests/no-fixed-time.test.ts`, scans the card screen's code for a clock time given to the
  card ("at about 15:08", "at 15:15") and is proven to catch a planted break. The two remaining clock times in the
  screen are contract facts, not the card's send time: the 15:00 bid and ask (the market-data cutoff), and the
  forecast capture's 15:15 deadline.
- Mockup 39's 2-top.js:8 has the same sentence. The screens lead fixes it on the 2.11 branch (design/ is theirs).

## Addendum 2: today's card held back (contract 2.12.0, owner 16 Oct 2026: "hold the card only, and say so on screen")

Branch `story/w3f-withheld`, on `story/fno-contract-2-12` 7db3830 (judge D PASS) merged with main 9241b4d (no
conflicts). It merges once 2.12 is on main.

- **Contract type:** `withheld: { session, reason_text } | null`.
- **The notice:** `heldBackOf` gives a red `role="alert"` notice with the owner's sentence, today's date, and "Below is
  the card of <its session>, not today’s", as mockup 39 shows. It sits after the TEST note and before the verdict, in
  the mockup's order.
- **The verdict line:** a held card's sub-line says "Previous session’s card", never "A paper trade today" or "Nothing
  to do today".
- **One step beyond mockup 39 (reasoning only):** the held card's own reason is dated, for example "On Fri 13 Nov
  2026: No new trade today: the weather is RED". The card's own words say "today", and under a held-back notice
  "today" means the earlier session.
- **Contract error (agreed with the screens lead):** if the card on record is not from an earlier session than the
  held-back one, only the notice is shown, saying "The card on record is not from an earlier session, so it is not
  shown". The schema cannot compare two fields; the page never shows such a card as today's.
- **Tests:** `lib/fno-card/tests/withheld.test.ts` covers the notice's words and dates, the verdict line and the dated
  reason, a normal day unchanged, and the contract error for an equal and a later date. The no-fixed-time test still
  passes.
- **Gates:** check_code_size, check_contract, check_fno_screens and the design copies pass; typecheck passes; `npm
  test` 575/575 with 0 skipped; build passes.
- **Screenshot:** of the held-back state at 1280 and 390 px, with india_withheld made the default temporarily and then
  reverted. It shows no overflow and no console errors.
