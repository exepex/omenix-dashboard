"""The stock page's F&O views (35-stock, India only), from NSE's daily F&O file of the page's day (35-stock/source/,
copied by fetch_fno.py): the listed futures and the option chain near the price for each monthly expiry, each contract
with its NSE trading code, plus the implied volatility of every option that traded (ours, Black-Scholes as the F&O tool
computes it). Also the LABELLED EXAMPLES the owner asked for (13 Oct 2026: every mockup shows positive and negative
cases): what the families' F&O suggestions would look like (one suggested, one refused, one staying out). Real contracts and prices;
the suggestions and results are invented and marked Example. Deterministic.
"""
from __future__ import annotations

import csv
import os
from datetime import date

from chain_data import implied_vol

OPTIONS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "35-stock", "source", "fno_options.csv")
MONTHS = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split()


def code(ticker: str, expiry: str, strike: float | None = None, kind: str = "FUT") -> str:
    """NSE's trading code of a monthly contract, e.g. RELIANCE26OCTFUT, RELIANCE26OCT1160CE."""
    d = date.fromisoformat(expiry)
    head = f"{ticker}{d.year % 100:02d}{MONTHS[d.month - 1]}"
    return head + ("FUT" if kind == "FUT" else f"{strike:g}{kind}")


def leg(r: dict, ticker: str, day: str) -> dict:
    close, prev, k, spot = float(r["close"]), float(r["prev_close"]), float(r["strike"]), float(r["spot"])
    traded = int(r["contracts"]) > 0
    t = max((date.fromisoformat(r["expiry"]) - date.fromisoformat(day)).days, 0.25) / 365
    iv = implied_vol(close, spot, k, t, r["type"]) if traded and close > 0 else None
    return {"code": code(ticker, r["expiry"], k, r["type"]), "price": close, "chg_pct": round((close / prev - 1) * 100, 1) if prev else None,
            "oi": int(r["oi"]), "oi_chg": int(r["oi_chg"]), "contracts": int(r["contracts"]), "traded": traded,
            "iv": round(iv * 100, 1) if iv else None}


def chain(ticker: str, day: str) -> list:
    """Per expiry: the strikes within 10% of the price, the call (CE) and put (PE) of each, the strike nearest the price,
    and where most calls and most puts are open."""
    if not os.path.exists(OPTIONS):
        return []
    by = {}
    for r in csv.DictReader(open(OPTIONS)):
        if r["underlying"] == ticker:
            e = by.setdefault(r["expiry"], {"spot": float(r["spot"]), "strikes": {}})
            e["strikes"].setdefault(float(r["strike"]), {})[r["type"]] = leg(r, ticker, day)
    out = []
    for expiry, e in sorted(by.items()):
        rows = [{"strike": k, **{s.lower(): v.get(s) for s in ("CE", "PE")}} for k, v in sorted(e["strikes"].items())]
        atm = min(rows, key=lambda r: abs(r["strike"] - e["spot"]))["strike"]
        most = lambda side: max(rows, key=lambda r: (r[side] or {}).get("oi", 0))["strike"]
        out.append({"expiry": expiry, "spot": e["spot"], "atm": atm, "most_calls": most("ce"), "most_puts": most("pe"), "rows": rows})
    return out


def examples(ticker: str, futures: list, chains: list, lot: int) -> dict:
    """EXAMPLE state (not today): the families' F&O suggestions (one suggested, one refused, one staying out), built on
    today's real contracts and prices."""
    near = chains[0] if chains else None
    if not near or not futures:
        return {}
    atm = next(r for r in near["rows"] if r["strike"] == near["atm"])
    above = next((r for r in near["rows"] if r["strike"] > near["atm"] + 30 and r["ce"] and r["ce"]["traded"]), atm)
    pick = lambda fam, side, leg_, why, state: {"family": fam, "side": side, "code": leg_["code"], "price": leg_["price"], "lots": 1, "lot": lot,
                                                 "max_loss": round(leg_["price"] * lot) if side == "buy" else None, "why": why, "state": state}
    fut = futures[0]
    return {
        "note": "EXAMPLE state, not today: how the families' F&O suggestions look once an F&O strategy has passed testing.",
        "picks": [pick("rule", "buy", atm["ce"], "Expects a rise by expiry; the most you can lose is what you pay.", "open"),
                  {"family": "hybrid", "side": "sell", "code": code(ticker, fut["expiry"]), "price": fut["fut"], "lots": 1, "lot": lot, "max_loss": None,
                   "why": "Wanted to sell the future; your loss limit refused it (a future's loss has no fixed limit).", "state": "refused"},
                  {"family": "ai", "side": None, "code": None, "why": "Stays out: no clear direction.", "state": "out"},
                  pick("rule", "buy", above["ce"], "A cheaper call further from the price; needs a bigger rise.", "open")],
    }
