"""The stock page's (35-stock) derived views, from the same REAL records as stock_data.py: the strategy families and
their votes, who holds the stock now, the sector index to compare with, results by quarter and year, risk against
the index, and the listed stock futures. Everything here is computed by us and labelled so on the page. Deterministic.
"""
from __future__ import annotations

import csv
import math
import os

from screener_data import buildup

MOCKUPS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDICES = os.path.join(MOCKUPS, "34-markets", "source", "indices.csv")
EXPIRIES = os.path.join(MOCKUPS, "35-stock", "source", "fno_expiries.csv")

# Families are shown by name, count and votes only: how each decides is ours to keep (owner, 13 Oct 2026).
ORDER = ("rule", "hybrid", "ai", "baseline")

# NSE industry (Nifty 500 list) -> the NSE sector index to compare with (only indices the markets page records).
SECTOR_INDEX = {
    "Oil Gas & Consumable Fuels": "Nifty Oil & Gas", "Power": "Nifty Energy", "Information Technology": "Nifty IT",
    "Automobile and Auto Components": "Nifty Auto", "Financial Services": "Nifty Financial Services",
    "Fast Moving Consumer Goods": "Nifty FMCG", "Healthcare": "Nifty Healthcare Index", "Metals & Mining": "Nifty Metal",
    "Realty": "Nifty Realty", "Media Entertainment & Publication": "Nifty Media", "Consumer Durables": "Nifty Consumer Durables",
    "Telecommunication": "Nifty Telecommunications", "Capital Goods": "Nifty Capital Goods",
}


def families(views: list, horizons: list) -> list:
    """One row per family: its number of strategies and its vote per horizon (buy of its strategies)."""
    out = []
    for fam in ORDER:
        ids = sorted({v["strategy_id"] for v in views if v["family"] == fam})
        votes = [{"h": h["h"], **h["family"].get(fam, {"buy": 0, "of": 0})} for h in horizons]
        out.append({"family": fam, "n": len(ids), "votes": votes})
    return out


def holders(views: list, open_trades: list) -> dict:
    """The strategies holding the stock now, out of all that judged it."""
    every = {v["strategy_id"] for v in views}
    holding = sorted({t["strategy_id"] for t in open_trades})
    return {"holding": len(holding), "of": len(every)}


def sector(industry: str | None, dates: list) -> dict | None:
    """The NSE sector index's closes on the stock's dates (None before the index's first recorded day)."""
    name = SECTOR_INDEX.get(industry or "")
    if not name:
        return None
    closes = {r["date"]: float(r["close"]) for r in csv.DictReader(open(INDICES)) if r["index"] == name}
    return {"name": name, "close": [closes.get(d) for d in dates], "from": min(closes)}


def growth(now, before) -> float | None:
    return round((now / before - 1) * 100, 1) if now is not None and before not in (None, 0) else None


def with_yoy(rows: list, back: int) -> list:
    """Each period with its year-on-year growth of revenue and profit (`back` periods earlier is the same period last year)."""
    out = []
    for i, r in enumerate(rows):
        prev = rows[i - back] if i >= back else None
        margin = round(r["profit"] / r["revenue"] * 100, 1) if r.get("profit") is not None and r.get("revenue") else None
        out.append({**r, "margin": margin, "rev_yoy": growth(r.get("revenue"), prev and prev.get("revenue")),
                    "profit_yoy": growth(r.get("profit"), prev and prev.get("profit"))})
    return out


def results_india(financials: list) -> dict:
    pick = lambda kind: sorted((r for r in financials if r["basis"] == "consolidated" and r["period_type"] == kind), key=lambda r: r["period_end"])
    row = lambda r: {"end": r["period_end"], "revenue": r.get("revenue"), "profit": r.get("net_profit"),
                     "pbt": r.get("profit_before_tax"), "owners": r.get("profit_to_owners")}
    return {"quarters": with_yoy([row(r) for r in pick("quarterly")], 4), "years": with_yoy([row(r) for r in pick("annual")], 1)}


def annual_vol(closes: list) -> float | None:
    """Annualised volatility of daily returns over the closes given, in %."""
    rets = [math.log(b / a) for a, b in zip(closes, closes[1:]) if a and b]
    if len(rets) < 20:
        return None
    mean = sum(rets) / len(rets)
    return round(math.sqrt(sum((r - mean) ** 2 for r in rets) / (len(rets) - 1) * 252) * 100, 1)


def risk(own: list, bench: list, beta) -> dict:
    """Beta (the stock tool's) and one year's volatility of the stock and its index (ours)."""
    year = lambda xs: [x for x in xs[-251:] if x is not None]
    return {"beta": beta, "vol": annual_vol(year(own)), "bench_vol": annual_vol(year(bench))}


def expiries(ticker: str) -> list:
    """The listed monthly futures of the day (NSE): price, its change, open interest, its change and the build-up."""
    if not os.path.exists(EXPIRIES):
        return []
    out = []
    for r in csv.DictReader(open(EXPIRIES)):
        if r["underlying"] != ticker:
            continue
        close, prev, oi, d_oi = float(r["close"]), float(r["prev_close"]), int(r["oi"]), int(r["oi_chg"])
        out.append({"expiry": r["expiry"], "fut": close, "chg_pct": round((close / prev - 1) * 100, 2), "oi": oi,
                    "oi_chg_pct": round(d_oi / (oi - d_oi) * 100, 1) if oi - d_oi else None, "buildup": buildup(close / prev - 1, d_oi)})
    return out


def gaps(m: str) -> list:
    """What the page would show but the records do not hold yet (owner's feedback, 13 Oct 2026: "not recorded yet")."""
    common = ["Debt and the balance sheet", "Cash flow", "A three-year history of results (the records hold the last quarters only)",
              "Settled strategy trades on this stock (none has closed yet)", "Hybrid strategies (none built yet)",
              "A plain summary of the AI team's view for beginners (the page shows example wording)"]
    if m == "india":
        return common + ["The sector index before 6 Oct 2025 (the markets page records one year)"]
    return common + ["A sector fund to compare with (the stock tool records only the S&P 500 fund)",
                     "Profit before tax and profit to owners (not in the copied SEC concepts)"]


def example_records(m: str) -> dict:
    """EXAMPLE (not today): each family's settled record on this stock per exit (N+1, N+3, N+5) and in total, a winning
    and a losing case (owner, 13 Oct 2026: mockups show both). Paper results in the market's currency."""
    k = 1 if m == "india" else 0.012   # rupee figures, or about the same in dollars for a $1,000 trade size
    def case(rows):
        out = []
        for fam, by in rows:
            by_h = {h: {"settled": s, "wins": w, "pnl": round(p * k)} for h, (s, w, p) in by.items()}
            total = {"settled": sum(x["settled"] for x in by_h.values()), "wins": sum(x["wins"] for x in by_h.values()),
                     "pnl": sum(x["pnl"] for x in by_h.values()) if by_h else None}
            out.append({"family": fam, **total, "by_h": by_h})
        return out
    win = [("rule", {1: (8, 5, 5100), 3: (6, 4, 4300), 5: (4, 2, 3000)}), ("hybrid", {}),
           ("ai", {1: (4, 2, -600), 3: (3, 1, -1100), 5: (2, 1, -400)}), ("baseline", {1: (6, 3, 500), 3: (5, 2, 400), 5: (4, 2, 900)})]
    lose = [("rule", {1: (8, 3, -4200), 3: (6, 2, -3100), 5: (4, 1, -2000)}), ("hybrid", {}),
            ("ai", {1: (4, 1, -1800), 3: (3, 1, -1500), 5: (2, 1, -1100)}), ("baseline", {1: (6, 3, 700), 3: (5, 3, 900), 5: (4, 2, 1000)})]
    return {"note": "EXAMPLE, made-up numbers: how this card looks once trades on this stock close. Not real results.",
            "win": case(win), "lose": case(lose)}


def example_marks(dates: list, closes: list) -> dict:
    """EXAMPLE (not today): the buy and sell marks a proven family would put on the price chart. The dates are fixed
    sessions of the real series (not chosen with hindsight) and each result is the real price change between them."""
    marks = []
    for back in (240, 180, 120, 60):   # fixed sessions back, each trade held 20 sessions
        if back + 20 < len(closes):
            i, j = len(closes) - 1 - back, len(closes) - 1 - back + 20
            marks.append({"buy": dates[i], "buy_at": closes[i], "sell": dates[j], "sell_at": closes[j],
                          "ret": round((closes[j] / closes[i] - 1) * 100, 2)})
    return {"family": "rule", "proof": "proven on 140 settled trades across stocks: 64% won, ahead of the baselines",
            "note": "EXAMPLE, not today: no family is proven yet, so no buy or sell marks are shown. Marks appear only once a family is proven.",
            "marks": marks}
