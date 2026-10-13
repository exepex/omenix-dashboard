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
