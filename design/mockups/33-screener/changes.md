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

- **13 Oct 2026: data correction, split and bonus adjustment (orchestrator; judge 42 confirmed from NSE's closes; data
  fix, not a contract change).**
  - Root cause: NSE's daily equity file never adjusts past prices. On KOTAKBANK's 5:1 split day (14 Jan 2026) it shows
    close 421.00 against a previous close of 2,132.60. So 1-year changes and 52-week highs and lows mixed pre-split
    and post-split prices, e.g. KOTAKBANK 1 year −79.15%.
  - Fix: `fetch_nse.py` scales past prices by each split or bonus factor (`_platform/nse_actions.py`), using NSE's
    corporate actions: the year's bulk list, plus a per-symbol lookup for any unexplained one-day jump, because the
    bulk list leaves out ETFs such as BANKNIFTY1. The 108 actions used are in `source/actions.csv`.
    Rights issues are not adjusted: their factor needs the rights price, and it is small.
  - Effect: 317 values on 99 stocks
    (98 52-week high, 86 1-year %, 49 RSI 14, 46 52-week low, 20 3-month %, 7 1-month %, 7 20-day avg volume, 4 1-week %). Examples: KOTAKBANK 1 year −79.15% → +4.24%, 52-week high
    2,266.00 → 453.20; ANGELONE −86.57% → +34.30%; BANKNIFTY1 −90.19% → −1.94%.
  - Every before → after value: `changes_2026-10-13_splits.csv`.
  - Screen counts (India, all stocks), from the split fix. The 1 Feb fix changed none of them:

    | Screen | Before → after |
    |---|---|
    | Near 52-week high | 50 → 54 |
    | Near 52-week low | 254 → 247 |
    | Volume 3× usual | 64 → 63 |
    | Up 10%+ in a month | 246 → 247 |
    | Down 10%+ in a month | 653 → 648 |
    | RSI under 30 | 265 → 248 |
    | Big moves today, High delivery | unchanged (165, 145) |

- **13 Oct 2026: data correction, demergers (orchestrator's decision; judge 42 addendum 2; data fix, not a contract change).**
  - Root cause: a demerger lowers the share price on its ex-date (e.g. INDIAGLYCO 1,111.70 → 236.20 on 2 Sep 2026),
    and NSE's files never adjust past prices, so 1-year changes and 52-week highs mixed before and after.
  - Fix: prices before a demerger's ex-date are scaled by the ex-date open ÷ the previous close. On that day NSE runs
    a special pre-open call auction, and the open is the price it discovers: NSE's own reference, not an estimate.
    Some evidence: NSE's practice, circular not re-read. 16 demergers are in the year. TMPV and HEGAM did not trade on
    their ex-date, so they stay unadjusted and are marked "not adjusted" in `source/actions.csv`. DALMIASUG's factor
    is 1.0 (its open equalled the previous close).
  - Effect: 50 values on 13 stocks (13 52-week high, 12 1-year %, 7 52-week low, 7 RSI 14, 6 3-month %, 3 1-month %, 2 1-week %).
    Examples: INDIAGLYCO 1 year −64.52% → +75.32%; DCMSRIND −76.31% → −20.05%; VEDL −43.86% → +50.02%. Every value
    is in `changes_2026-10-13_demergers.csv`.
  - Screen counts: Near 52-week high 54 → 56; Up 10%+ in a month 247 → 250; Down 10%+ in a month 648 → 646; RSI under 30 248 → 246.

- **13 Oct 2026: data correction, renamed stocks (judge's P6 round 2, relayed by the orchestrator; data fix, not a contract change).**
  - Root cause: NSE's daily files list a stock under its symbol of that day. A stock renamed within the year (HEG to
    HEGAM on 22 Sep 2026, TATAMOTORS to TMPV on 24 Oct 2025) had its history split across two symbols. The example
    builder kept only the new one, so 1-year changes and 52-week ranges were missing or short, and P6's real build
    (which joins renames) differed.
  - Fix: `fetch_nse.py` joins each rename of the year from NSE's `symbolchange.csv`: the old symbol's sessions before
    the change, then the new one's. Corporate actions listed under the old symbol follow the rename. The joins used are
    in `source/renames.csv`: 56 renames, ETFs included.
  - Effect, checked against NSE:
    - TMPV 1 year: — → −32.69% (284.45 against 422.58);
    - HEGAM 1 year: — → +26.84% (231.29 against 182.35).
    - Their demergers (TMPV 14 Oct 2025, HEGAM 7 Sep 2026) are now adjusted. The earlier entry's "did not trade on their ex-date" was this same cause: they traded under their old symbols.
  - In all: 123 values on 55 stocks, plus each one's session count (50 1-year %, 28 52-week high, 19 52-week low, 15 RSI 14, 6 3-month %, 3 1-month %, 2 20-day average volume). Every value is in `changes_2026-10-13_renames.csv`.
