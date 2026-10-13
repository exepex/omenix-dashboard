"""NIFTY option chain of design/mockups/32-option-chain, from REAL NSE data (owner, 13 Oct 2026: real values only).

Source: NSE's daily F&O file (UDiFF bhavcopy) and its daily index file, 1 Jun to 12 Oct 2026, reduced to the NIFTY
contracts expiring up to 31 Dec 2026 within 10% of the 12 Oct close (32-option-chain/source/, made by
32-option-chain/fetch_nse.py; the F&O tool reads the same files, exepex/trading docs/DATA_SOURCES.md). Computed here
the way the F&O tool computes (fno/analytics.py, story B1), and labelled as ours: IV by Black-Scholes from the close,
only when the contract traded (no dividend, rate 6.5%, calendar days to expiry / 365), Greeks, put-call ratio, max
pain, the ATM straddle. Not available, and said so on the page: bid and ask (the F&O tool's 3 pm recording of the
nearest two monthly expiries began on 13 Oct 2026 and is not published yet) and anything live. Deterministic.
"""
from __future__ import annotations

import csv
import gzip
import os
from datetime import date
from math import erf, exp, log, pi, sqrt

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "32-option-chain", "source")
RATE, BAND, NEAR = 0.065, 0.05, 10          # rate (F&O tool config); snapshot band; strikes either side of the money


def ncdf(x: float) -> float:
    return 0.5 * (1 + erf(x / sqrt(2)))


def bs(s: float, k: float, t: float, v: float, kind: str) -> float:
    d1 = (log(s / k) + (RATE + v * v / 2) * t) / (v * sqrt(t))
    d2 = d1 - v * sqrt(t)
    return s * ncdf(d1) - k * exp(-RATE * t) * ncdf(d2) if kind == "CE" else k * exp(-RATE * t) * ncdf(-d2) - s * ncdf(-d1)


def implied_vol(price: float, s: float, k: float, t: float, kind: str) -> float | None:
    """Bisection between 1% and 200% (B1); None when no volatility gives the price."""
    lo, hi = 0.01, 2.0
    if not bs(s, k, t, lo, kind) <= price <= bs(s, k, t, hi, kind):
        return None
    for _ in range(80):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if bs(s, k, t, mid, kind) < price else (lo, mid)
    return (lo + hi) / 2


def greeks(s: float, k: float, t: float, v: float, kind: str) -> dict:
    d1 = (log(s / k) + (RATE + v * v / 2) * t) / (v * sqrt(t))
    d2, pdf, disc = d1 - v * sqrt(t), exp(-d1 * d1 / 2) / sqrt(2 * pi), exp(-RATE * t)
    theta = -s * pdf * v / (2 * sqrt(t)) + (-RATE * k * disc * ncdf(d2) if kind == "CE" else RATE * k * disc * ncdf(-d2))
    return {"delta": round(ncdf(d1) if kind == "CE" else ncdf(d1) - 1, 2), "gamma": round(pdf / (s * v * sqrt(t)), 5),
            "theta": round(theta / 365, 2), "vega": round(s * pdf * sqrt(t) / 100, 2)}


def chance_above(s: float, level: float, t: float, v: float) -> float:
    """Risk-neutral chance that NIFTY ends above `level` at expiry, from the option's own IV (labelled as such)."""
    return ncdf((log(s / level) + (RATE - v * v / 2) * t) / (v * sqrt(t)))


MONTHLY: set = set()   # filled by chain_payload: the last expiry of each month


def code_of(expiry: str, strike: float, kind: str) -> str:
    """NSE trading symbol: NIFTY26OCT22300CE for a monthly expiry, NIFTY26O1322300CE (year, month letter, day) for a weekly."""
    d = date.fromisoformat(expiry)
    when = d.strftime("%b").upper() if expiry in MONTHLY else "123456789OND"[d.month - 1] + f"{d.day:02d}"
    return f"NIFTY{expiry[2:4]}{when}{int(strike)}{kind}"


def load() -> tuple:
    with gzip.open(os.path.join(SRC, "nifty_fo.csv.gz"), "rt") as handle:
        fo = list(csv.DictReader(handle))
    with open(os.path.join(SRC, "index.csv")) as handle:
        ix = sorted(csv.DictReader(handle), key=lambda r: r["date"])
    return fo, ix


def contract(r: dict, expiry: str, k: float, kind: str, spot: float, t: float) -> dict:
    close, prev, vol = float(r["close"]), float(r["prev_close"] or 0), int(float(r["volume"]))
    v = implied_vol(close, spot, k, t, kind) if vol else None
    breakeven = k + close if kind == "CE" else k - close
    chance = chance_above(spot, breakeven, t, v) if v else None
    return {"code": code_of(expiry, k, kind), "close": close, "chg": round(close - prev, 2) if prev else None,
            "chg_pct": round((close / prev - 1) * 100, 2) if prev else None, "oi": int(float(r["oi"])), "oi_chg": int(float(r["oi_chg"])),
            "volume": vol, "iv": round(v * 100, 1) if v else None, "greeks": greeks(spot, k, t, v, kind) if v else None,
            "breakeven": round(breakeven, 2), "chance": None if chance is None else round((chance if kind == "CE" else 1 - chance) * 100)}


def expiry_block(day: str, expiry: str, rows: list, spot: float, monthly: bool) -> dict:
    days = (date.fromisoformat(expiry) - date.fromisoformat(day)).days
    t = max(days, 0.25) / 365
    by = {}
    for r in rows:
        if r["type"] in ("CE", "PE"):
            by.setdefault(float(r["strike"]), {})[r["type"]] = r
    out = [{"strike": k, **{kind: contract(r, expiry, k, kind, spot, t) for kind, r in by[k].items()}} for k in sorted(by) if len(by[k]) == 2]
    atm = min(out, key=lambda r: (abs(r["strike"] - spot), r["strike"]))
    pain = lambda x: sum(max(0, x - r["strike"]) * r["CE"]["oi"] + max(0, r["strike"] - x) * r["PE"]["oi"] for r in out)
    straddle = round(atm["CE"]["close"] + atm["PE"]["close"], 2)
    above, below = [r for r in out if r["strike"] >= spot], [r for r in out if r["strike"] <= spot]
    top = lambda kind, key: max(above if kind == "CE" else below, key=lambda r: r[kind][key])["strike"]   # calls above NIFTY, puts below
    ivs = [atm["CE"]["iv"], atm["PE"]["iv"]]
    return {"expiry": expiry, "days": days, "monthly": monthly, "future": next((float(r["close"]) for r in rows if r["type"] == "FUT"), None),
            "stats": {"pcr": round(sum(r["PE"]["oi"] for r in out) / max(1, sum(r["CE"]["oi"] for r in out)), 2),
                      "max_pain": min((r["strike"] for r in out), key=pain), "atm": atm["strike"],
                      "atm_iv": round(sum(ivs) / 2, 1) if all(ivs) else None, "straddle": straddle,
                      "range": [round(spot - straddle, 2), round(spot + straddle, 2)],
                      "call_wall": top("CE", "oi"), "put_wall": top("PE", "oi"), "call_add": top("CE", "oi_chg"), "put_add": top("PE", "oi_chg")},
            "rows": out}


def histories(fo: list, ix: list, blocks: list) -> dict:
    """Daily series: NIFTY and India VIX closes, each expiry's PCR, and each near-the-money contract's close and OI."""
    dates = sorted({r["date"] for r in ix})
    pos = {d: i for i, d in enumerate(dates)}
    idx = {name: [None] * len(dates) for name in ("Nifty 50", "India VIX")}
    for r in ix:
        idx[r["index"]][pos[r["date"]]] = float(r["close"])
    near = set()
    for b in blocks:
        i = next(n for n, r in enumerate(b["rows"]) if r["strike"] == b["stats"]["atm"])
        near |= {(b["expiry"], r["strike"]) for r in b["rows"][max(0, i - NEAR): i + NEAR + 1]}
    series, oi_by = {}, {}
    for r in fo:
        if r["type"] not in ("CE", "PE"):
            continue
        tot = oi_by.setdefault((r["expiry"], r["date"]), {"CE": 0, "PE": 0})
        tot[r["type"]] += int(float(r["oi"]))
        if (r["expiry"], float(r["strike"])) in near:
            traded = float(r["volume"]) > 0          # a close without trades is not a price: no point that day
            series.setdefault(code_of(r["expiry"], float(r["strike"]), r["type"]), []).append((pos[r["date"]], float(r["close"]) if traded else None, int(float(r["oi"]))))
    pcr = {b["expiry"]: [round(oi_by[(b["expiry"], d)]["PE"] / oi_by[(b["expiry"], d)]["CE"], 2) if oi_by.get((b["expiry"], d), {}).get("CE") else None
                         for d in dates] for b in blocks}
    contracts = {code: {"from": s[0][0], "close": [c for _, c, _ in s], "oi": [o for _, _, o in s]} for code, s in ((k, sorted(v)) for k, v in series.items())}
    return {"dates": dates, "nifty": idx["Nifty 50"], "vix": idx["India VIX"], "pcr": pcr, "contracts": contracts}


def chain_payload() -> dict:
    fo, ix = load()
    day = max(r["date"] for r in fo)
    today = [r for r in fo if r["date"] == day]
    spot, lot = float(today[0]["underlying"]), int(today[0]["lot"])
    expiries = sorted({r["expiry"] for r in today})
    monthly = lambda e: e == max(x for x in {r["expiry"] for r in fo} if x[:7] == e[:7])
    MONTHLY.update(e for e in {r["expiry"] for r in fo} if monthly(e))
    blocks = [expiry_block(day, e, [r for r in today if r["expiry"] == e], spot, monthly(e)) for e in expiries]
    nifty = [r for r in ix if r["index"] == "Nifty 50"]
    return {
        "day": day,
        "underlying": {"sym": "NIFTY", "spot": spot, "chg": round(spot - float(nifty[-2]["close"]), 2), "chg_pct": float(nifty[-1]["chg_pct"]),
                       "vix": next(float(r["close"]) for r in reversed(ix) if r["index"] == "India VIX"), "lot": lot},
        "clock": {"now": f"{day}T12:30:00Z", "open_utc": f"{day}T03:45:00Z", "close_utc": f"{day}T10:00:00Z",
                  "next_open_utc": "2026-10-13T03:45:00Z", "example_open_now": f"{day}T07:00:00Z"},
        "source": {"eod": f"NSE daily F&O file of {day}: close, settlement, open interest and its change, volume (no bid or ask)",
                   "index": "NSE daily index file (NIFTY 50, India VIX)", "history_from": dates_from(ix), "as_of": f"{day}T10:00:00Z"},
        "quotes": {"status": "not_published", "started": "2026-10-13",
                   "text": "The F&O tool's 3 pm recording of bid and ask (the nearest two monthly expiries, strikes within 5% of NIFTY) started on "
                           "13 Oct 2026. Its quotes appear here once the tool publishes them; until then no paper order can be priced."},
        "computed": {"iv": "Black-Scholes from the day's close, only when the contract traded; rate 6.5%, no dividend; calendar days to expiry / 365",
                     "chance": "Risk-neutral: what the option's own price implies, not a forecast"},
        "books": "No F&O book holds a position: no strategy has passed testing yet, so each book records “no approved strategy” at 3 pm.",
        "expiries": blocks, "history": histories(fo, ix, blocks),
    }


def dates_from(ix: list) -> str:
    return min(r["date"] for r in ix)


def band_items(chain: dict) -> dict:
    """Contracts within 5% of spot as instruments (search, quick view, order window): the day's close, no quote."""
    s, lot, out = chain["underlying"]["spot"], chain["underlying"]["lot"], {}
    for b in chain["expiries"]:
        d = date.fromisoformat(b["expiry"])
        for r in (r for r in b["rows"] if abs(r["strike"] - s) <= s * BAND):
            for kind in ("CE", "PE"):
                c = r[kind]
                out[c["code"]] = {"id": c["code"], "kind": "option", "sym": f"NIFTY {d.day} {d.strftime('%b').upper()} {int(r['strike'])} {kind}",
                                  "code": c["code"], "name": f"Option · lot {lot}", "underlying": "NIFTY", "lot": lot, "last": c["close"],
                                  "chg_pct": c["chg_pct"] or 0.0, "bid": None, "ask": None, "iv": c["iv"], "source": "eod", "as_of": chain["source"]["as_of"]}
    return out
