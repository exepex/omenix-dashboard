"""The market overview of design/mockups/34-markets, from REAL data of Mon 12 Oct 2026 (owner, 13 Oct 2026: real
values only; history 1D / 1W / 1M / 3M / 1Y as on the screener).

Sources, all fetched by hand (the build never fetches):
- 34-markets/source/indices.csv: NSE's daily index file for a year (broad, sector and volatility indices, with P/E,
  P/B and dividend yield), fetch_nse_indices.py;
- 34-markets/source/stocktool.json: the stock tool's own records (world markets, currencies, commodities, yields, US
  sector funds; FII/DII flows; events; its session reading), fetch_stocktool.py;
- the screener's NSE sources (33-screener/source/) for breadth, sectors and movers, and the chain's
  (32-option-chain/source/) for NIFTY's expiries; read through screener_data.py and chain_data.py (one reader each).
Computed here, labelled as ours: returns, 52-week figures, breadth, the sector averages (equal-weighted).
"""
from __future__ import annotations

import csv
import json
import os
from statistics import mean

from chain_data import load as chain_load
from screener_data import SRC as SCREENER, fno_india, stocks_india, stocks_us

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "34-markets", "source")
BROAD = ["Nifty 50", "Nifty Next 50", "Nifty 500", "NIFTY Midcap 100", "NIFTY Smallcap 100"]
BACK = {"d1": 1, "w1": 5, "m1": 21, "m3": 63, "y1": 250}
INDEX_FNO = ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")   # the index options that trade; the others' ATM closes are stale


def months(name: str) -> float:
    """Maturity of a Treasury par yield label ("1 Mo", "1.5 Month", "10 Yr") in months, to order the curve."""
    n, unit = name.split()[0], name.split()[1].lower()
    return float(n) * (12 if unit.startswith("yr") else 1)


def returns(closes: list) -> dict:
    last = closes[-1]
    return {k: round((last / closes[-1 - n] - 1) * 100, 2) if len(closes) > n and closes[-1 - n] else None for k, n in BACK.items()}


def num(x):
    return None if x in ("", "-", None) else float(x)


def indices_india() -> dict:
    by = {}
    for r in csv.DictReader(open(os.path.join(SRC, "indices.csv"))):
        by.setdefault(r["index"], []).append(r)
    dates = sorted({r["date"] for rs in by.values() for r in rs})
    out = []
    for name, rs in by.items():
        closes = [float(r["close"]) for r in rs]
        last = rs[-1]
        group = "vol" if name == "India VIX" else "broad" if name in BROAD else "sector"
        keep = 250 if group != "sector" else 63
        out.append({"name": name, "group": group, "close": closes[-1], **returns(closes), "hi52": max(closes[-250:]), "lo52": min(closes[-250:]),
                    "pe": num(last["pe"]), "pb": num(last["pb"]), "dy": num(last["div_yield"]), "from": len(dates) - min(keep, len(closes)),
                    "closes": closes[-keep:]})
    order = {n: i for i, n in enumerate(BROAD + ["India VIX"])}
    out.sort(key=lambda x: (order.get(x["name"], 99), -(x["d1"] or 0)))
    return {"dates": dates, "rows": out}


def instruments(st: dict, roles: tuple) -> list:
    out = []
    for k, v in st["instruments"].items():
        if v["role"] in roles and len(v["closes"]) > 1:
            closes = [c for _, c in v["closes"]]
            out.append({"id": k, "name": v["name"], "role": v["role"], "close": closes[-1], "as_of": v["closes"][-1][0], **returns(closes),
                        "hi52": max(closes[-250:]), "lo52": min(closes[-250:]), "closes": closes[-250:], "sectors": v.get("sectors")})
    return out


def breadth(rows: list) -> dict:
    up = sum(1 for r in rows if (r["d1"] or 0) > 0)
    down = sum(1 for r in rows if (r["d1"] or 0) < 0)
    return {"n": len(rows), "up": up, "down": down, "flat": len(rows) - up - down,
            "high": sum(1 for r in rows if r["h"] and r["p"] >= r["h"]), "near_high": sum(1 for r in rows if r["h"] and r["p"] >= r["h"] * .98),
            "low": sum(1 for r in rows if r["l"] and r["p"] <= r["l"]), "near_low": sum(1 for r in rows if r["l"] and r["p"] <= r["l"] * 1.02),
            "up_1m": sum(1 for r in rows if (r["m1"] or 0) > 0)}


def sectors(rows: list) -> list:
    """Nifty 500 industries: the equal-weighted average change of their stocks (ours), with the best and worst stock."""
    by = {}
    for r in rows:
        if r["g"]:
            by.setdefault(r["g"], []).append(r)
    out = []
    for g, rs in by.items():
        avg = lambda k: round(mean(r[k] for r in rs if r[k] is not None), 2) if any(r[k] is not None for r in rs) else None
        best, worst = max(rs, key=lambda r: r["d1"] or 0), min(rs, key=lambda r: r["d1"] or 0)
        out.append({"g": g, "n": len(rs), **{k: avg(k) for k in BACK}, "up": sum(1 for r in rs if (r["d1"] or 0) > 0),
                    "down": sum(1 for r in rs if (r["d1"] or 0) < 0), "best": [best["s"], best["d1"]], "worst": [worst["s"], worst["d1"]]})
    return sorted(out, key=lambda x: -x["n"])


def movers(rows: list, n: int = 8) -> dict:
    slim = lambda r: {k: r[k] for k in ("s", "n", "p", "d1", "v", "va")}
    by = lambda key, rev=True: [slim(r) for r in sorted((r for r in rows if r["d1"] is not None), key=key, reverse=rev)[:n]]
    return {"gainers": by(lambda r: r["d1"]), "losers": by(lambda r: r["d1"], False), "active": by(lambda r: r["p"] * r["v"])}


def expiries() -> list:
    fo, _ = chain_load()
    day = max(r["date"] for r in fo)
    found = sorted({r["expiry"] for r in fo if r["date"] == day})
    monthly = {e for e in found if e == max(x for x in found if x[:7] == e[:7])}
    return [{"date": e, "type": "fno_expiry", "name": f"NIFTY {'monthly' if e in monthly else 'weekly'} expiry", "ticker": None} for e in found]


def events(st: dict, extra: list, day: str) -> list:
    keep = [{"date": r["date"], "type": r["type"], "name": r["name"], "ticker": r.get("ticker")} for r in st["events"] if r["date"] > day]
    return sorted(keep + [e for e in extra if e["date"] > day], key=lambda e: (e["date"], e["name"]))[:24]


def flows(st: dict) -> dict:
    by = {}
    for r in st["flows"]:
        by.setdefault(r["date"], {})["fii" if r["category"].startswith("FII") else "dii"] = {"buy": r["buy_cr"], "sell": r["sell_cr"], "net": r["net_cr"], "provisional": r["provisional"]}
    fpi = {}
    for r in st["fpi"]:
        fpi[r["reporting_date"]] = round(fpi.get(r["reporting_date"], 0) + r["net_cr"], 2)
    return {"days": [{"date": d, **v} for d, v in sorted(by.items())], "nsdl": [{"date": d, "net": v} for d, v in sorted(fpi.items())]}


def regime(r: dict | None) -> dict | None:
    return None if not r else {k: r[k] for k in ("as_of_date", "session_date", "regime", "vol_level", "bench_ret_5d", "major_event", "major_event_names", "notes")}


def markets_payload() -> dict:
    st = json.load(open(os.path.join(SRC, "stocktool.json")))
    tracked = json.load(open(os.path.join(SCREENER, "tracked.json")))
    names = {r["symbol"]: r for r in csv.DictReader(open(os.path.join(SCREENER, "names.csv")))}
    day = st["day"]
    ind_rows = stocks_india(tracked["markets"]["india"])
    n500 = [r for r in ind_rows if "n500" in r["u"]]
    liquid = [r for r in ind_rows if (r["va"] or 0) >= 1e5 and r["p"] >= 20]
    I, U = st["markets"]["india"], st["markets"]["us"]
    us_rows = stocks_us(tracked["markets"]["us"])
    return {
        "day": day,
        "markets": {
            "india": {"indices": indices_india(), "world": instruments(I, ("cue", "factor", "fx")),
                      "breadth": {"all": breadth(ind_rows), "n500": breadth(n500)}, "sectors": sectors(n500),
                      "movers": {"n500": movers(n500), "all": movers(liquid)},
                      "fno": [r for r in fno_india(names) if r["s"] in INDEX_FNO], "flows": flows(I),
                      "events": events(I, expiries(), day), "regime": regime(I["regime"]),
                      "source": {"indices": f"NSE's daily index file, a year to {day} (P/E, P/B, dividend yield as NSE publishes them)",
                                 "stocks": f"NSE's daily equity files ({len(ind_rows):,} stocks traded on {day}); movers in All NSE: usual volume 1,00,000+ and price ₹20+",
                                 "world": "the stock tool's daily closes (Yahoo Finance), each at its own market's close",
                                 "flows": "NSE's FII/FPI and DII cash-market figures (provisional) and NSDL's FPI equity flows, as the stock tool records them",
                                 "events": "the stock tool's event records (results, ex-dividend) and NSE's NIFTY expiries"}},
            "us": {"indices": {"rows": instruments(U, ("benchmark", "vol_index"))}, "sectors": instruments(U, ("sector_etf",)),
                   "world": instruments(U, ("cue", "factor", "fx")), "breadth": {"ours": breadth(us_rows)}, "movers": {"ours": movers(us_rows, 5)},
                   "yields": sorted(({"name": r["name"].replace("Treasury par yield ", ""), "value": r["value"], "date": r["date"]} for r in U["yields"]),
                                    key=lambda y: months(y["name"])),
                   "events": events(U, [], day), "regime": regime(U["regime"]),
                   "source": {"indices": "the stock tool's daily closes of the S&P 500 fund (SPY) and the VIX; there is no free US index file",
                              "stocks": "the stock tool's 20 US companies", "world": "the stock tool's daily closes (Yahoo Finance)",
                              "yields": "US Treasury par yields (treasury.gov) as the stock tool records them", "events": "the stock tool's event records"}},
        },
    }
