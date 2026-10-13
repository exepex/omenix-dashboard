"""The screener of design/mockups/33-screener, from REAL data (owner, 13 Oct 2026: real values; whole market, with the
tools' signals where they follow a company; history 1D / 1W / 1M / 3M / 1Y).

Sources (33-screener/source/, fetched by hand; the build never fetches):
- equity.csv, delivery.csv, names.csv: NSE's daily equity files, one row per stock that traded on the day
  (fetch_nse.py);
- fno.csv.gz: NSE's daily F&O files, per underlying and day for three months (fetch_nse.py);
- tracked.json: the stock tool's own records of its 20 companies per market (fetch_tracked.py).
Computed here and labelled as ours: returns, the 52-week position, volume against its usual, the futures build-up,
ATM IV (Black-Scholes on the at-the-money call and put closes, as the F&O tool computes, chain_data.py) and its
3-month range, and the move priced in by expiry. Deterministic.
"""
from __future__ import annotations

import csv
import gzip
import json
import os
from datetime import date

from chain_data import implied_vol

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "33-screener", "source")
PERIODS = {"d1": "prev", "w1": "close_1w", "m1": "close_1m", "m3": "close_3m", "y1": "close_1y"}


def pct(now: float, then) -> float | None:
    return round((now / float(then) - 1) * 100, 2) if then not in ("", None) and float(then) else None


def num(x) -> float | None:
    return None if x in ("", "-", None) else float(x)     # NSE writes "-" where it has no figure


def stock_row(sym: str, name: str, sector: str, r: dict, delivery: float | None) -> dict:
    """One stock as a compact record: s symbol, n name, g sector, p close, returns by period, h/l 52-week high and low,
    v volume, va its 20-day average, dl delivery %, r RSI 14, k the last 21 closes."""
    close = float(r["close"])
    spark = r["spark_1m"] if isinstance(r["spark_1m"], list) else [float(x) for x in r["spark_1m"].split(";") if x]
    return {"s": sym, "n": name, "g": sector, "p": close, **{k: pct(close, r[v]) for k, v in PERIODS.items()},
            "h": num(r["high_52w"]), "l": num(r["low_52w"]), "v": int(float(r["volume"] or 0)), "va": num(r["volume_avg20"]),
            "dl": delivery, "r": num(r["rsi14"]), "k": [round(x, 2) for x in spark]}


def stocks_india(tracked: dict) -> list:
    names = {r["symbol"]: r for r in csv.DictReader(open(os.path.join(SRC, "names.csv")))}
    delivery = {r["symbol"]: num(r["delivery_pct"]) for r in csv.DictReader(open(os.path.join(SRC, "delivery.csv")))}
    fno = {r["underlying"] for r in csv.DictReader(gzip.open(os.path.join(SRC, "fno.csv.gz"), "rt"))}
    out = []
    for r in csv.DictReader(open(os.path.join(SRC, "equity.csv"))):
        sym, meta = r["symbol"], names.get(r["symbol"], {})
        row = stock_row(sym, meta.get("name") or sym, meta.get("nifty500_industry") or "", r, delivery.get(sym))
        row["u"] = [x for x in ("n500" if meta.get("nifty500_industry") else None, "fno" if sym in fno else None, "ours" if sym in tracked else None) if x]
        if not row["u"]:
            del row["k"]          # the 1-month line only for Nifty 500, F&O and followed stocks (keeps the page light)
        out.append(row)
    return out


def stocks_us(tracked: dict) -> list:
    out = []
    for sym, t in sorted(tracked.items()):
        if "prices" in t:
            row = stock_row(sym, t["name"], t["sector"], t["prices"], None)
            row["u"] = ["ours"]
            out.append(row)
    return out


def signals(tracked: dict) -> dict:
    """The tools' view of their own companies (stock tool records; families only, never a model's name)."""
    keep = ("name", "sector", "strategies", "prob_up", "model_as_of", "beta_1y", "days_to_results", "next_results", "ex_dividend",
            "short_days_to_cover", "short_change_pct", "short_as_of")
    return {sym: {k: t[k] for k in keep if k in t} for sym, t in tracked.items()}


def atm_iv(r: dict) -> float | None:
    """The average of the at-the-money call's and put's IV, each only when it traded (B1 rule), as a percentage."""
    spot, k = float(r["spot"]), float(r["atm"])
    t = max((date.fromisoformat(r["expiry"]) - date.fromisoformat(r["date"])).days, 0.25) / 365
    ivs = [implied_vol(float(r[f"atm_{x}"]), spot, k, t, x.upper()) for x in ("ce", "pe") if r[f"atm_{x}"] and float(r[f"atm_{x}_vol"] or 0) > 0]
    ivs = [v for v in ivs if v]
    return round(sum(ivs) / len(ivs) * 100, 1) if ivs else None


def buildup(price_chg: float, oi_chg: float) -> str:
    """The futures reading every Indian broker shows: price and open interest moving together or apart."""
    if oi_chg >= 0:
        return "long_buildup" if price_chg >= 0 else "short_buildup"
    return "short_covering" if price_chg >= 0 else "long_unwinding"


def fno_india(names: dict) -> list:
    rows = list(csv.DictReader(gzip.open(os.path.join(SRC, "fno.csv.gz"), "rt")))
    day = max(r["date"] for r in rows)
    hist = {}
    for r in rows:
        hist.setdefault(r["underlying"], []).append(r)
    out = []
    for sym, rs in sorted(hist.items()):
        rs.sort(key=lambda r: r["date"])
        r = rs[-1]
        if r["date"] != day:
            continue
        fut, prev, oi, d_oi = float(r["fut_close"]), float(r["fut_prev"] or 0), float(r["fut_oi"]), float(r["fut_oi_chg"])
        price_chg = round((fut / prev - 1) * 100, 2) if prev else 0.0
        oi_chg = round(d_oi / (oi - d_oi) * 100, 2) if oi - d_oi else 0.0
        # an expiry days away gives no sound ATM IV: like the F&O tool's G1 rule, a day counts only with 7+ days to expiry
        ivs = [(x["date"], atm_iv(x) if (date.fromisoformat(x["expiry"]) - date.fromisoformat(x["date"])).days >= 7 else None) for x in rs]
        series = [v for _, v in ivs if v is not None]
        iv = ivs[-1][1]
        straddle = (float(r["atm_ce"] or 0) + float(r["atm_pe"] or 0)) if r["atm_ce"] and r["atm_pe"] else None
        out.append({"s": sym, "n": names.get(sym, {}).get("name") or sym, "kind": r["kind"], "spot": float(r["spot"]), "fut": fut,
                    "fc": price_chg, "oi": int(oi), "oc": oi_chg, "b": buildup(price_chg, d_oi), "iv": iv,
                    "ivl": min(series) if series else None, "ivh": max(series) if series else None,
                    "ivr": round((iv - min(series)) / (max(series) - min(series)) * 100) if iv is not None and len(series) > 1 and max(series) > min(series) else None,
                    "pcr": round(float(r["pe_oi"]) / float(r["ce_oi"]), 2) if float(r["ce_oi"]) else None,
                    "mv": round(straddle / float(r["spot"]) * 100, 1) if straddle else None, "lot": int(r["lot"]), "x": r["expiry"],
                    "dx": (date.fromisoformat(r["expiry"]) - date.fromisoformat(day)).days, "ks": [v for _, v in ivs[-21:]]})
    return out


def screener_payload() -> dict:
    tracked = json.load(open(os.path.join(SRC, "tracked.json")))
    names = {r["symbol"]: r for r in csv.DictReader(open(os.path.join(SRC, "names.csv")))}
    day = tracked["day"]
    india, us = tracked["markets"]["india"], tracked["markets"]["us"]
    return {
        "day": day, "clock": {"now": f"{day}T12:30:00Z"},
        "markets": {
            "india": {"stocks": stocks_india(india), "signals": signals(india), "fno": fno_india(names),
                      "source": {"stocks": f"NSE daily equity files, one year to {day} (EQ and BE series); delivery: NSE's security-wise file of {day}",
                                 "sectors": "NSE's Nifty 500 list (industries); other stocks have no sector in NSE's files",
                                 "fno": f"NSE daily F&O files, three months to {day}: the nearest monthly expiry of each underlying"}},
            "us": {"stocks": stocks_us(us), "signals": signals(us),
                   "source": {"stocks": f"the stock tool's daily prices of its 20 US companies, one year to {day} (there is no free whole-market US file)"}},
        },
        "tools": {"horizon_days": tracked["horizon_days"], "source": "the stock tool's published records (strategy views made before the open, model chances, features)"},
    }
