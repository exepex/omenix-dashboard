"""Split and bonus adjustment for the mockups' NSE price series (NSE's daily file never adjusts past prices: on
KOTAKBANK's 5:1 split day, 14 Jan 2026, it shows close 421.00 against a previous close of 2,132.60).

Source: NSE's corporate actions (`/api/corporates-corporateActions?index=equities&from_date=..&to_date=..`), reduced
to the actions that change the share count of the same equity:
- "Face Value Split (Sub-Division) - From Rs X/- ... To Rs Y/-": prices before the ex-date times Y / X;
- "Bonus a:b" (a new shares for every b held): prices before the ex-date times b / (a + b).
Not adjusted: rights issues (the factor needs the rights price and the market price; it is small) and bonus
preference shares ("Scheme Of Arrangement - Bonus NCRPS", another security).
"""
from __future__ import annotations

import datetime as dt
import re

API = "https://www.nseindia.com/api/corporates-corporateActions?index=equities"
JUMP = (0.55, 1.8)   # a one-day close ratio outside this, with no action to explain it, gets a per-symbol lookup

SPLIT = re.compile(r"face value split.*?from\s+r[se]\.?\s*([\d.]+).*?to\s+r[se]\.?\s*([\d.]+)", re.I)
BONUS = re.compile(r"^\s*bonus\s+(\d+)\s*:\s*(\d+)", re.I)


def factor(subject: str) -> float | None:
    """The price factor of one action, or None when it does not change the equity's share count."""
    split = SPLIT.search(subject)
    if split:
        old, new = float(split.group(1)), float(split.group(2))
        return new / old if old and new and new != old else None
    bonus = BONUS.search(subject)
    if bonus:
        new, held = int(bonus.group(1)), int(bonus.group(2))
        return held / (new + held) if new and held else None
    return None


def actions(rows: list) -> list:
    """[symbol, ex_date (ISO), factor, subject] for every split and bonus among NSE's corporate-action rows."""
    out = []
    for r in rows:
        f = factor(r.get("subject", ""))
        if f is not None and r.get("series") in ("EQ", "BE"):
            ex = dt.datetime.strptime(r["exDate"], "%d-%b-%Y").date().isoformat()
            out.append([r["symbol"], ex, round(f, 6), r["subject"].strip()])
    return sorted(out)


def adjust(series: list, symbol_actions: list) -> list:
    """Rows (date, series, close, high, low, volume) with prices before each ex-date times its factor and volumes
    divided by it, so every price compares with today's share count."""
    out = []
    for date, srs, close, high, low, volume in series:
        f = 1.0
        for _sym, ex, fac, _subject in symbol_actions:
            if date < ex:
                f *= fac
        out.append((date, srs, close * f, high * f, low * f, round(volume / f)))
    return out


def unexplained(series: dict, known: list) -> list:
    """Symbols with a one-day close jump outside JUMP and no known action: NSE's bulk list leaves out some (ETFs such
    as BANKNIFTY1), so these are looked up one by one."""
    covered = {a[0] for a in known}
    out = []
    for sym, rows in series.items():
        ratios = (b[2] / a[2] for a, b in zip(rows, rows[1:]) if a[2])
        if sym not in covered and any(not JUMP[0] < r < JUMP[1] for r in ratios):
            out.append(sym)
    return sorted(out)
