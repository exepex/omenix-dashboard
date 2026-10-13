"""Split and bonus adjustment for the mockups' NSE price series (NSE's daily file never adjusts past prices: on
KOTAKBANK's 5:1 split day, 14 Jan 2026, it shows close 421.00 against a previous close of 2,132.60).

Source: NSE's corporate actions (`/api/corporates-corporateActions?index=equities&from_date=..&to_date=..`), reduced
to the actions that change the share count of the same equity:
- "Face Value Split (Sub-Division) - From Rs X/- ... To Rs Y/-": prices before the ex-date times Y / X;
- "Bonus a:b" (a new shares for every b held): prices before the ex-date times b / (a + b).
- "Demerger": prices before the ex-date times (ex-date open ÷ previous close). On a demerger's ex-date NSE runs a
  special pre-open call auction and the open is the price it discovers, so this is NSE's own reference for the share
  without the demerged business (the factor is set by `demerger_factors`; a demerger without an ex-date trade stays
  unadjusted and is marked so in actions.csv).
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


def is_demerger(subject: str) -> bool:
    return subject.strip().lower().startswith("demerger")


def actions(rows: list) -> list:
    """[symbol, ex_date (ISO), factor, subject] for every split, bonus and demerger among NSE's corporate-action rows
    (a demerger's factor is None until `demerger_factors` sets it from the prices)."""
    out = []
    for r in rows:
        f = factor(r.get("subject", ""))
        if (f is not None or is_demerger(r.get("subject", ""))) and r.get("series") in ("EQ", "BE"):
            ex = dt.datetime.strptime(r["exDate"], "%d-%b-%Y").date().isoformat()
            out.append([r["symbol"], ex, round(f, 6) if f is not None else None, r["subject"].strip()])
    return sorted(out)


def demerger_factors(acts: list, series: dict) -> list:
    """Each demerger's factor: ex-date open ÷ the previous session's close of the same symbol; None (and a note) when
    the symbol did not trade on its ex-date."""
    out = []
    for sym, ex, fac, subject in acts:
        if fac is None and is_demerger(subject):
            rows = series.get(sym, [])
            i = next((k for k, r in enumerate(rows) if r[0] == ex), None)
            if i and rows[i - 1][2]:
                fac = round(rows[i][6] / rows[i - 1][2], 6)
            else:
                subject += " (not adjusted: no trade on the ex-date)"
        out.append((sym, ex, fac, subject))
    return out


def adjust(series: list, symbol_actions: list) -> list:
    """Rows (date, series, close, high, low, volume, open) with prices before each ex-date times its factor, and volumes
    divided by split and bonus factors (not a demerger's), so every figure compares with today's shares."""
    out = []
    for date, srs, close, high, low, volume, opening in series:
        f = shares = 1.0
        for _sym, ex, fac, subject in symbol_actions:
            if fac and date < ex:
                f *= fac
                shares *= 1.0 if is_demerger(subject) else fac   # a demerger keeps the share count
        out.append((date, srs, round(close * f, 2), round(high * f, 2), round(low * f, 2), round(volume / shares), round(opening * f, 2)))
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
