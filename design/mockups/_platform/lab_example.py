"""EXAMPLE paper trades for the Strategy lab mockup (design/mockups/38-strategy-lab): made-up trades on future dates
(from 2 Nov 2026, like the Forecast lab's Examples), so every shape the data can take is visible before real trades
exist (owner, 13 Oct 2026: good, bad and empty cases). Never real prices or results.

Each trade is [entry day, exit day, symbol, net P&L after charges, return %, reason, strategy]; days index `dates`.
Profiles (made up, chosen to show the cases): stocks: Rule-based small steady edge, AI team bold and losing after
charges, Hybrid has no stock strategy yet (as today), Baselines follow the market. F&O: Book 1 Rule-based wins often
but gives back much in the stormy month, Book 2 Hybrid the best, Book 3 AI team joins later and loses a little.
"""
from __future__ import annotations

import numpy as np

from forecast_example import example_dates

SEED = 20261014
STORMY = range(55, 86)   # trading days of a made-up stormy patch (volatile regime)
TICKERS = {"india": ["RELIANCE", "HDFCBANK", "INFY", "TCS", "ICICIBANK", "MARUTI", "ITC", "LT", "SBIN", "BHARTIARTL"],
           "us": ["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "JPM", "XOM", "UNH", "TSLA"]}
STOCK = {   # family: (strategies, trades a day, edge % per trade, spread %, calm-only edge)
    "rule": (["Model + news", "Model + confirmed news only", "Model + news, 60% bar", "Model + news + global cues"], 2.0, 0.42, 1.7, 0.6),
    "ai": (["AI team"], 1.4, 0.10, 3.4, 0.0),
    "baseline": (["Always buy", "Follow yesterday", "Model without news"], 3.0, 0.0, 1.6, 0.0)}
FNO = {      # family: (start day, trades a day, win rate calm, win, loss, win rate stormy)
    "rule": (1, 0.45, 0.76, 2600, -5600, 0.22),
    "hybrid": (1, 0.55, 0.75, 2900, -3500, 0.70),
    "ai": (40, 0.30, 0.47, 5600, -5400, 0.40)}
FNO_TRADES = ["Sold NIFTY options", "Bought NIFTY options", "NIFTY futures", "Sold BANKNIFTY options"]


def market(rng, days: int) -> np.ndarray:
    """NIFTY's made-up daily returns (fraction): a calm upward drift, then the stormy patch. Each regime's noise is
    centred so the drift is exactly the one stated (+0.06% a day calm, -0.15% a day stormy), whatever the seed."""
    storm = np.array([d in STORMY for d in range(1, days + 1)])
    out = np.empty(days)
    for mask, drift, sd in ((~storm, 0.0006, 0.007), (storm, -0.0015, 0.015)):
        z = rng.normal(0, sd, mask.sum())
        out[mask] = z - z.mean() + drift
    return out


def stock_reason(parts: dict, net: float) -> str:
    """The biggest driver in the trade's own direction: the market, the sector, news, or the company alone."""
    side = [(k, v) for k, v in parts.items() if (v > 0) == (net > 0)] or list(parts.items())
    k, v = max(side, key=lambda x: abs(x[1]))
    return {"market": "market_up" if v > 0 else "market_down", "sector": "sector_lift" if v > 0 else "sector_drag",
            "news": "news_good" if v > 0 else "news_bad"}.get(k, "company")


def stock_trades(rng, m: str, fam: str, days: int, mkt: np.ndarray) -> list:
    names, rate, edge, spread, calm_edge = STOCK[fam]
    amount, cost = (100000.0, 450.0) if m == "india" else (1000.0, 1.2)
    out = []
    for d in range(1, days + 1):
        for _ in range(rng.poisson(rate)):
            hold = int(rng.integers(1, 6))
            if d + hold > days:
                continue
            mk = float(mkt[d:d + hold].sum()) * 100 * (1.0 if fam != "ai" else 1.3)
            parts = {"market": mk, "sector": rng.normal(0, 0.7), "news": rng.normal(0, 1.4) if rng.random() < 0.25 else 0.0,
                     "company": rng.normal(edge + (calm_edge if d not in STORMY else -calm_edge), spread)}
            ret = sum(parts.values())
            net = round(amount * ret / 100 - cost, 2)
            out.append([d, d + hold, TICKERS[m][int(rng.integers(0, 10))], net, round(100 * net / amount, 3), stock_reason(parts, net),
                        names[int(rng.integers(0, len(names)))]])
    return out


def fno_trades(rng, fam: str, days: int, mkt: np.ndarray) -> list:
    start, rate, win_calm, win, loss, win_storm = FNO[fam]
    out = []
    for d in range(start, days + 1):
        for _ in range(rng.poisson(rate)):
            hold = int(rng.integers(3, 16))
            if d + hold > days:
                continue
            storm = any(x in STORMY for x in range(d, d + hold))
            won = rng.random() < (win_storm if storm else win_calm)
            net = round(max(-10000.0, (rng.normal(win, abs(win) * 0.45) if won else rng.normal(loss, abs(loss) * 0.5)) - 120), 2)   # the ₹10,000 cap includes charges
            kind = FNO_TRADES[int(rng.integers(0, len(FNO_TRADES)))]
            reason = ("calm_market" if net > 0 else "big_move") if "Sold" in kind else ("trend_right" if net > 0 else "trend_wrong")
            out.append([d, d + hold, kind, net, round(100 * net / 500000, 3), reason, "Book " + {"rule": "1", "hybrid": "2", "ai": "3"}[fam]])
    return out


def nifty_levels(mkt: np.ndarray, start: float = 25000.0) -> list:
    lv, out = start, []
    for r in mkt:
        lv *= 1 + r
        out.append(round(lv, 2))
    return out


def example(days: int) -> dict:
    """One Example state: trades by market, asset and family, NIFTY's (and the US index's) made-up levels."""
    rng = np.random.default_rng(SEED)   # one made-up history; an earlier Example is a prefix of it
    full = 160
    mk = {m: market(rng, full) for m in ("india", "us")}
    keep = lambda rows: [t for t in rows if t[1] <= days]
    stocks = {m: {f: keep(stock_trades(rng, m, f, full, mk[m])) for f in STOCK} for m in ("india", "us")}
    fno = {f: keep(fno_trades(rng, f, full, mk["india"])) for f in FNO}
    return {"days": days, "dates": example_dates(full)[:days], "stormy": [STORMY.start, STORMY.stop - 1],
            "index": {m: nifty_levels(mk[m])[:days] for m in mk}, "trades": {"india": {"stocks": stocks["india"], "fno": fno}, "us": {"stocks": stocks["us"]}}}
