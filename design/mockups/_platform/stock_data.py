"""The stock page of design/mockups/35-stock, from REAL records: the stock tool's own published data of one company
per market (35-stock/source/stock.json, copied read-only by fetch_stock.py) and, for an Indian F&O stock, NSE's F&O
files (the screener's source, 33-screener/source/fno.csv.gz). The page's clock is 13 Oct 2026 14:30 IST (09:00 UTC):
India's market is open, the price is the 12 Oct close plus the stock tool's last price check; the US market is closed.

Computed here and labelled as ours: returns, 52-week figures, the trailing P/E (from the filed quarterly diluted EPS:
the last four quarters, a fourth quarter derived as the year minus nine months where only those are filed), the
strategies' agreement by family, the futures build-up and ATM IV. Strategies are named as users see them
(real_data.display_names): every AI strategy is the one AI team, and no AI model is ever named. Deterministic.
"""
from __future__ import annotations

import csv
import gzip
import json
import os
from datetime import date

from real_data import FAMILY, display_names
from screener_data import SRC as SCREENER, atm_iv, buildup
import stock_fno
import stock_views as V

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "35-stock", "source")
CLOCK = "2026-10-13T09:00:00Z"


def quote(m: str, M: dict) -> dict:
    bars, check = M["prices"][M["ticker"]], M["intraday"]
    close, prev = bars[-1][4], bars[-2][4]
    q = {"date": bars[-1][0], "close": close, "chg": round(close - prev, 2), "chg_pct": round((close / prev - 1) * 100, 2)}
    if check and check["session_date"] > bars[-1][0]:      # a price check of today's session, after the last close
        q["check"] = {"at": check["check_at"], "price": check["last_price"], "chg_pct": round((check["last_price"] / close - 1) * 100, 2),
                      "open": check.get("open_price")}
    return q


def chart(M: dict) -> dict:
    own, bench = M["prices"][M["ticker"]], {b[0]: b[4] for b in M["prices"][M["benchmark"]]}
    return {"dates": [b[0] for b in own], "close": [b[4] for b in own], "volume": [b[5] for b in own],
            "bench": [bench.get(b[0]) for b in own], "bench_name": {"NIFTY50": "NIFTY 50", "SPY": "S&P 500 fund"}[M["benchmark"]]}


def quarters_india(M: dict) -> list:
    q = [r for r in M["financials"] if r["basis"] == "consolidated" and r["period_type"] == "quarterly"]
    return [{"end": r["period_end"], "revenue": r.get("revenue"), "profit": r.get("net_profit"), "eps": r.get("eps_diluted")} for r in sorted(q, key=lambda r: r["period_end"])]


def quarters_us(M: dict) -> list:
    """Quarterly from SEC filings: 10-Q quarters as filed; a fiscal fourth quarter as the year minus nine months."""
    by = {}
    for r in M["fundamentals"]:
        span = (date.fromisoformat(r["period_end"]) - date.fromisoformat(r["period_start"])).days if r["period_start"] else 0
        key = (r["concept"], r["period_start"], r["period_end"])
        by[key] = min(by.get(key, r["value"]), r["value"]) if r["concept"] == "eps_diluted" else r["value"]   # split-restated duplicates: the adjusted (smaller) one
        by.setdefault(("span", key), span)
    def series(concept):
        q = {e: v for (c, s, e), v in ((k, v) for k, v in by.items() if k[0] == concept) if 80 <= by[("span", (c, s, e))] <= 100}
        years = [(s, e, v) for (c, s, e), v in ((k, v) for k, v in by.items() if k[0] == concept) if by[("span", (c, s, e))] > 350]
        for s, e, v in years:
            nine = next((v9 for (c, s9, e9), v9 in ((k, v) for k, v in by.items() if k[0] == concept) if s9 == s and 260 <= by[("span", (c, s9, e9))] <= 280), None)
            if nine is not None and e not in q:
                q[e] = round(v - nine, 2)
        return q
    eps, rev, profit = series("eps_diluted"), series("revenue"), series("net_income")
    return [{"end": e, "revenue": rev.get(e), "profit": profit.get(e), "eps": eps[e]} for e in sorted(eps)]


def years_us(M: dict) -> list:
    """Fiscal years from SEC filings: revenue and net income over a span of about a year."""
    by = {}
    for r in M["fundamentals"]:
        if r["period_start"] and r["concept"] in ("revenue", "net_income") and \
                (date.fromisoformat(r["period_end"]) - date.fromisoformat(r["period_start"])).days > 350:
            by.setdefault(r["period_end"], {"end": r["period_end"]})["profit" if r["concept"] == "net_income" else "revenue"] = r["value"]
    return [by[e] for e in sorted(by)]


def results(m: str, M: dict, quarters: list) -> dict:
    """Revenue, profit and margin by quarter and by year, with year-on-year growth (ours)."""
    if m == "india":
        R = V.results_india(M["financials"])
    else:
        R = {"quarters": V.with_yoy([{k: q[k] for k in ("end", "revenue", "profit")} for q in quarters], 4), "years": V.with_yoy(years_us(M), 1)}
    return {"quarters": R["quarters"][-8:], "years": R["years"][-3:]}


def valuation(close: float, quarters: list) -> dict:
    last4 = [q for q in quarters if q["eps"] is not None][-4:]
    ttm = round(sum(q["eps"] for q in last4), 2) if len(last4) == 4 else None
    return {"eps_ttm": ttm, "pe": round(close / ttm, 1) if ttm and ttm > 0 else None, "eps_to": last4[-1]["end"] if last4 else None}


def peers(M: dict, h: int, prob) -> dict | None:
    """The chance over all companies that day: its range, the most common value (as shown, 0.1 point) and how many share
    it and this one's, and the calibration slope (0 = the features are flattened: only the base rate and news move it)."""
    market = M["model_market"]
    chances = list(market["chances"].get(str(h), {}).values())
    if prob is None or not chances:
        return None
    shown = [round(p, 3) for p in chances]
    common = max(set(shown), key=lambda v: (shown.count(v), v))
    same = shown.count(round(prob, 3))
    slope = (market["versions"].get(str(h)) or {}).get("platt_slope")
    return {"same": same, "common": common, "common_n": shown.count(common), "n": len(chances), "lo": min(chances), "hi": max(chances), "slope": slope, "as_of": market["as_of_date"]}


def tools(m: str, M: dict) -> dict:
    names = display_names(m)
    horizons = []
    for r in M["ranges"]:
        h = r["horizon_days"]
        views = [v for v in M["views"] if v["horizon_days"] == h]
        fam = {}
        for v in views:
            f = fam.setdefault(v["family"], {"buy": 0, "of": 0})
            f["of"] += 1
            f["buy"] += int(v["qualifies"] and v["direction"] == "up")
        prob = next((s["prob_up"] for s in M["model"] if s["horizon_days"] == h), None)
        horizons.append({"h": h, "target_date": r["target_date"], "prob": prob, "peers": peers(M, h, prob), "lo80": r["lo80"], "lo50": r["lo50"], "hi50": r["hi50"], "hi80": r["hi80"],
                         "buy": sum(f["buy"] for f in fam.values()), "of": sum(f["of"] for f in fam.values()), "family": fam})
    R = M["reasoning"] or {}
    cost = M["costs"][0] if M["costs"] else None
    return {"session": M["views"][0]["session_date"] if M["views"] else None, "made_at": max((v["made_at"] for v in M["views"]), default=None),
            "horizons": horizons, "families": {k: {"label": v[0], "long": v[2]} for k, v in FAMILY.items()},
            "ai_team": {k: R.get(k) for k in ("as_of_date", "made_at", "bull_case", "bear_case", "verdict", "decision_1d", "decision_5d")} if R else None,
            "cost": {"round_trip_pct": cost["market_cost_pct"], "your_pct": cost["your_cost_pct"], "amount": cost["amount"], "lines": cost["market_cost_lines"]} if cost else None,
            "names": {v["strategy_id"]: names.get(v["strategy_id"], v["strategy_id"]) for v in M["views"]}}


def trades(m: str, M: dict) -> list:
    """Open paper trades; `amount` is the paper size every strategy trades (the views' one amount per market)."""
    names, amount = display_names(m), next((v["amount"] for v in M["views"]), None)
    return [{"name": names.get(t["strategy_id"], t["strategy_id"]), "family": t["family"], "h": t["horizon_days"], "entry_date": t["entry_date"], "amount": amount,
             "exit_date": t["exit_date"], "entry": t["entry_price"], "last": t["last_price"], "ret": round(t["ret_since_entry_pct"], 2), "band": t["band"],
             "check_at": t["check_at"]} for t in sorted(M["open_trades"], key=lambda t: (t["strategy_id"], t["horizon_days"]))]


def news(M: dict) -> list:
    claims = {}
    for c in M["claims"]:
        claims.setdefault(c["cluster_id"], []).append({k: c[k] for k in ("claim_type", "subject", "predicate")})
    flags = lambda n: "promotional" if "promotional" in n["flags"] else n["status"] or ("single_source" if "single_source" in n["flags"] else "not_checked")
    return [{"title": n["title"], "url": n["url"], "outlets": n["outlets"][:3], "n": n["n"], "status": flags(n), "first": n["first"], "last": n["last"],
             "claims": claims.get(n["cluster_id"], [])} for n in M["news"] if n["title"]][:25]


def corporate(m: str, M: dict) -> dict:
    out = {"events": [{k: e[k] for k in ("date", "type", "name")} for e in M["events"]],
           "results": [{"date": r["report_date"], "estimate": r["eps_estimate"], "reported": r["reported_eps"], "surprise_pct": r["surprise_pct"]} for r in M["earnings"]][-5:]}
    if m == "india":
        pledge = max((h for h in M["holdings"] if h.get("source") == "nse_pledge"), key=lambda h: h["period_end"], default=None)
        out.update({"delivery": [{"date": d["date"], "pct": d["delivery_pct"], "volume": d["volume"]} for d in M["delivery"]],
                    "announcements": [{k: a.get(k) for k in ("published_at", "category", "subject")} for a in M["announcements"]],
                    "deals": [{k: d.get(k) for k in ("date", "deal_type", "client", "side", "shares", "price")} for d in M["deals"]],
                    "pledge": {k: pledge.get(k) for k in ("period_end", "sdd_promoter_pct", "pledged_pct_of_promoter", "depository_pledged_pct")} if pledge else None})
    else:
        newest = {}
        for h in M["holdings"]:          # each filer's latest 13F only
            if h.get("value_usd") and h["period"] >= newest.get(h["filer_name"], {}).get("period", ""):
                newest[h["filer_name"]] = h
        top = sorted(newest.values(), key=lambda h: -h["value_usd"])[:5]
        out.update({"insiders": [{k: i.get(k) for k in ("filing_date", "insider_name", "role", "transaction_code", "shares", "price")} for i in M["insiders"]],
                    "short": [{k: s[k] for k in ("settlement_date", "short_interest", "change_pct", "days_to_cover")} for s in M["short_interest"]],
                    "holders": [{"name": h["filer_name"], "period": h["period"], "value_usd": h["value_usd"], "shares": h["shares"]} for h in top]})
    return out


def fno(ticker: str) -> dict | None:
    rows = sorted((r for r in csv.DictReader(gzip.open(os.path.join(SCREENER, "fno.csv.gz"), "rt")) if r["underlying"] == ticker), key=lambda r: r["date"])
    if not rows:
        return None
    r = rows[-1]
    fut, prev, oi, d_oi = float(r["fut_close"]), float(r["fut_prev"] or 0), float(r["fut_oi"]), float(r["fut_oi_chg"])
    ivs = [atm_iv(x) if (date.fromisoformat(x["expiry"]) - date.fromisoformat(x["date"])).days >= 7 else None for x in rows]
    seen = [v for v in ivs if v is not None]
    straddle = float(r["atm_ce"] or 0) + float(r["atm_pe"] or 0)
    return {"date": r["date"], "expiry": r["expiry"], "lot": int(r["lot"]), "fut": fut, "fut_chg_pct": round((fut / prev - 1) * 100, 2) if prev else None,
            "oi": int(oi), "oi_chg_pct": round(d_oi / (oi - d_oi) * 100, 2) if oi - d_oi else None, "buildup": buildup((fut / prev - 1) if prev else 0, d_oi),
            "iv": ivs[-1], "iv_lo": min(seen) if seen else None, "iv_hi": max(seen) if seen else None,
            "pcr": round(float(r["pe_oi"]) / float(r["ce_oi"]), 2) if float(r["ce_oi"]) else None, "move_pct": round(straddle / float(r["spot"]) * 100, 1),
            "history": {"dates": [x["date"] for x in rows], "fut": [float(x["fut_close"]) for x in rows], "oi": [int(x["fut_oi_all"]) for x in rows], "iv": ivs}}


def fno_block(t: str) -> dict | None:
    """The near future's facts and history, the listed futures with their codes, the option chain and the examples."""
    F = fno(t)
    if not F:
        return None
    futures = [{**x, "code": stock_fno.code(t, x["expiry"])} for x in V.expiries(t)]
    chains = stock_fno.chain(t, F["date"])
    return {**F, "expiries": futures, "chain": chains, "examples": stock_fno.examples(t, futures, chains, F["lot"])}


def stock_payload() -> dict:
    src = json.load(open(os.path.join(SRC, "stock.json")))
    tracked = json.load(open(os.path.join(SCREENER, "tracked.json")))["markets"]
    plain = json.load(open(os.path.join(SRC, "ai_plain.json")))
    names, industries = {}, {}
    for r in csv.DictReader(open(os.path.join(SCREENER, "names.csv"))):
        names[r["symbol"]], industries[r["symbol"]] = r["name"], r.get("nifty500_industry")
    out = {"clock": CLOCK, "source": src["source"], "markets": {}}
    for m, M in src["markets"].items():
        t = M["ticker"]
        q = quote(m, M)
        quarters = quarters_india(M) if m == "india" else quarters_us(M)
        f = M["features"] or {}
        bars = M["prices"][t]
        C, T = chart(M), tools(m, M)
        out["markets"][m] = {
            "ticker": t, "name": names.get(t) or tracked[m][t]["name"], "sector": tracked[m][t]["sector"], "exchange": "NSE" if m == "india" else "NASDAQ",
            "quote": q, "chart": {**C, "sector": V.sector(industries.get(t), C["dates"]) if m == "india" else None},
            "quarters": quarters[-6:], "valuation": valuation(q["close"], quarters), "results": results(m, M, quarters),
            "risk": V.risk(C["close"], C["bench"], f.get("beta_1y")), "families": V.families(M["views"], T["horizons"]),
            "holders": V.holders(M["views"], M["open_trades"]), "gaps": V.gaps(m), "examples": V.example_records(m),
            "ai_plain": {**plain[m], "note": plain["_note"]},
            "stats": {"hi52": max(b[2] for b in bars[-250:]), "lo52": min(b[3] for b in bars[-250:]), "vol_avg20": round(sum(b[5] for b in bars[-21:-1]) / 20),
                      "beta": f.get("beta_1y"), "rsi": f.get("rsi_14"), "atr_pct": f.get("atr_pct"), "vol_10d": f.get("realized_vol_10d"),
                      "days_to_results": f.get("days_to_earnings"), "as_of": f.get("as_of_date")},
            "tools": T, "trades": trades(m, M), "news": news(M), "corporate": corporate(m, M),
            "fno": fno_block(t) if m == "india" else None}
    return out
