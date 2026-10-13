# 33-screener: changes after sign-off

The signed-off contract is `notes.md` (signed off 13 Oct 2026, as of e28b43d). Every later change and its reason is
listed here.

- **13 Oct 2026: data correction (orchestrator; a data fix of example values, not a contract or design change, as in
  judge 19's lot-65 ruling).**
  - Root cause (found by the W11 session): `fetch_nse.py` `days()` walked weekdays, so it skipped NSE's Sunday
    1 Feb 2026 Union Budget session (NSE/FAOP/72352), for which NSE published the equity file.
  - Fix: the fetch scripts walk NSE's sessions (`_platform/nse_calendar.py`, a vendored copy of exepex/trading
    `research/data/calendar/nse_sessions.csv` with `--check`); `equity` was re-fetched. The F&O step reads three
    months (from July), so it is not affected.
  - Effect: the windows count sessions (1 year = 250 sessions back, 52-week high and low over the last 250), so each
    moves by one session. Changed: 2281 one-year changes,
    173 52-week highs, 34 52-week lows,
    3 RSI values and 1 three-month change
    (CLCIND now has enough sessions).
  - Largest one-year moves: ORBTEXP 32.82 → 10.69; AVALON 110.16 → 89.81; SKYGOLD 242.86 → 225.63; UNIPARTS 86.05 → 69.27; SHREEJISPG 246.84 → 263.24.
  - Every before → after value: `changes_2026-10-13_sessions.csv` (symbol, field, before, after).
  - Nothing else changed: prices of 12 Oct, the 1-day, 1-week and 1-month changes, F&O and the US market are identical.
