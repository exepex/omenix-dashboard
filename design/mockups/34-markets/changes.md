# 34-markets: changes after sign-off

The signed-off contract is `notes.md` (signed off 13 Oct 2026, as of 59b606d). Every later change and its reason is
listed here.

- **13 Oct 2026: data correction (orchestrator; a data fix of example values, not a contract or design change, as in
  judge 19's lot-65 ruling).**
  - Root cause (found by the W11 session): `fetch_nse_indices.py` walked weekdays, so it skipped NSE's Sunday
    1 Feb 2026 Union Budget session (NSE/FAOP/72352). NSE published that day's index file: Nifty 50 24,825.45, India
    VIX 15.10.
  - Fix: the fetch scripts walk NSE's sessions (`_platform/nse_calendar.py`, a vendored copy of exepex/trading
    `research/data/calendar/nse_sessions.csv` with `--check`). The re-fetch added the 22 index rows of 1 Feb and
    changed no other row.
  - Effect: the year window now starts one session later (`from` +1), so every 1-year change moves. Nifty Pharma's
    52-week low was wrong: 1 Feb's close 21,535.30 is below the 21,549.55 shown before.

  | Index | Before → after |
  |---|---|
  | Nifty 50 | 1-year % -10.82 → -10.93 |
  | Nifty Next 50 | 1-year % -0.35 → -0.47 |
  | Nifty 500 | 1-year % -5.81 → -5.97 |
  | NIFTY Midcap 100 | 1-year % 1.41 → 0.94 |
  | NIFTY Smallcap 100 | 1-year % 8.35 → 8.02 |
  | India VIX | 1-year % 49.66 → 51.74 |
  | Nifty Media | 1-year % 2.16 → 2.63 |
  | Nifty Auto | 1-year % -6.6 → -6.87 |
  | Nifty Realty | 1-year % -8.17 → -9.16 |
  | Nifty Pharma | 1-year % 19.74 → 19.22; 52-week low 21549.55 → 21535.3 |
  | Nifty Energy | 1-year % 1.38 → 1.09 |
  | Nifty Healthcare Index | 1-year % 9.51 → 9.23 |
  | Nifty Consumer Durables | 1-year % -4.98 → -5.34 |
  | Nifty Private Bank | 1-year % -1.34 → -1.36 |
  | Nifty Financial Services | 1-year % -6.91 → -7.14 |
  | Nifty Metal | 1-year % 17.33 → 17.67 |
  | Nifty Oil & Gas | 1-year % -10.13 → -10.57 |
  | Nifty Bank | 1-year % -2.12 → -2.35 |
  | Nifty IT | 1-year % -18.35 → -18.32 |
  | Nifty Infrastructure | 1-year % -6.76 → -7.1 |
  | Nifty PSU Bank | 1-year % 5.46 → 5.89 |
  | Nifty FMCG | 1-year % -19.88 → -19.45 |
  - Nothing else changed (other fields and the US market are identical).

- **13 Oct 2026: data correction, split and bonus adjustment (orchestrator; judge 42; data fix, not a contract change).**
  - Root cause: the screener's sources (33) used raw NSE closes, which are never adjusted for splits or bonus issues,
    so 34's breadth, sector and mover figures that read them were off for split stocks (see 33's changes.md).
  - Breadth: all near_high 50 → 54; all near_low 254 → 247; all up_1m 689 → 692; n500 near_high 6 → 7; n500 near_low 55 → 54.
  - Sector 1-year changes (average over the sector's stocks):

  | Sector | Before → after |
  |---|---|
  | Financial Services | y1 -9.49 → -0.21 |
  | Capital Goods | y1 22.75 → 25.24; m3 -1.46 → -0.4 |
  | Healthcare | y1 13.87 → 15.21 |
  | Automobile and Auto Components | y1 8.94 → 10.71 |
  | Fast Moving Consumer Goods | y1 -4.11 → 20.06 |
  | Chemicals | y1 2.25 → 2.37 |
  | Information Technology | y1 -11.86 → -12.34 |
  | Consumer Services | y1 -20.14 → -18.8 |
  | Metals & Mining | y1 2.86 → 3.28 |
  | Power | y1 -6.25 → -6.2 |
  | Oil Gas & Consumable Fuels | y1 1.7 → 1.29 |
  | Consumer Durables | y1 -3.88 → -3.8 |
  | Services | y1 0.11 → 4.2 |
  | Construction | y1 -20.93 → -18.16 |
  | Realty | y1 -15.5 → -14.68 |
  | Construction Materials | y1 -23.04 → -23.57 |
  | Telecommunication | y1 82.86 → 81.56 |
  | Textiles | y1 19.03 → 19.57 |
  | Media Entertainment & Publication | y1 15.29 → 13.72 |
  | Diversified | y1 -12.48 → -10.87 |
  - Mover: the first loser's 20-day average volume 101959.0 → 394213.0
    (its volumes before a split are now divided by the split factor). Nothing else changed.

- **13 Oct 2026: data correction, demergers (follows 33's demerger adjustment; data fix).** Breadth: all high 11 → 12; all near_high 54 → 56; all up_1m 692 → 695. Sectors:
  Fast Moving Consumer Goods 1-year 20.06 → 20.1; Metals & Mining 1-year 3.28 → 8.49. Nothing else changed.

- **13 Oct 2026: data correction, renamed stocks (follows 33's rename join; data fix).** Breadth: all near_low 247 → 240; all up_1m 695 → 697; Nifty 500 near_low 54 → 53. Sectors: Capital Goods 1-month −3.82 → −3.94, 3-month −0.4 → −0.21, 1-year 25.24 → 25.26; Automobile and Auto Components 1-year 10.71 → 9.6; Information Technology 1-year −12.34 → −12.81. Nothing else changed.

- **13 Oct 2026: W14 (owner's UI feedback), look only; no data, row or contract change.**
  - The design system now owns the section head (`.sec-head`), the sortable header and the interaction rules. Links
    and "see all" links are underlined; buttons and filter chips are bordered; disabled controls are dashed; a plain
    chip is a borderless label. The page's own copies of those rules were removed.
  - Rebuilt with `build.py`. Checks: `check_page.js` (no console errors, no external requests, no overflow) and
    `check_text.js` (0 findings).
  - Claims: `reviews/claude/response_30_w14-ui.md`.
