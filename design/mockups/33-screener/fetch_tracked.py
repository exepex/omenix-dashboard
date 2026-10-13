"""Copy the stock tool's own published records of its 20 companies per market into source/tracked.json (run by hand).

    python design/mockups/33-screener/fetch_tracked.py <clone of contactexepex/agentic-stock-prediction> 2026-10-12

Reads only (this repository never writes to a backend): config/markets/<market>.yaml for the companies and sectors,
and data/<market>/ for the last day: prices (one year, for the US where no whole-market file exists),
strategy_predictions (the strategies' view for that session, made before the open), model_scores (the model's chance
of a rise), features (RSI 14, beta, days to results, ex-dividend date), earnings_estimates (next results date) and,
for the US, short_interest. Names of AI models never leave this script: a strategy is counted by its family only.
"""
import csv
import glob
import json
import os
import sys

import yaml

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source", "tracked.json")
HORIZON = 5     # the N+5 view, as on Home's picks


def jsonl(root: str, market: str, name: str, day: str) -> list:
    files = sorted(f for f in glob.glob(os.path.join(root, "data", market, name, "*", "*", "*.jsonl")) if os.path.basename(f)[:10] <= day)
    return [json.loads(line) for line in open(files[-1])] if files else []


def price_summary(root: str, market: str, tickers: list, day: str) -> dict:
    """One year of the stock tool's daily closes: the same figures as the NSE summary (fetch_nse.py)."""
    files = sorted(f for f in glob.glob(os.path.join(root, "data", market, "prices", "*", "*", "*.csv")) if os.path.basename(f)[:10] <= day)[-260:]
    series = {t: [] for t in tickers}
    for f in files:
        for r in csv.DictReader(open(f)):
            if r["ticker"] in series and r["close"]:
                series[r["ticker"]].append((r["date"], float(r["close"]), float(r["high"]), float(r["low"]), int(float(r["volume"] or 0))))
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from fetch_nse import rsi14
    back = lambda s, n: s[-1 - n][1] if len(s) > n else None
    out = {}
    for t, s in series.items():
        s = sorted(set(s))
        if not s or s[-1][0] != day:
            continue
        vols = [v for *_, v in s[-21:-1]]
        out[t] = {"close": s[-1][1], "prev": back(s, 1), "close_1w": back(s, 5), "close_1m": back(s, 21), "close_3m": back(s, 63), "close_1y": back(s, 250),
                  "high_52w": max(x[2] for x in s[-250:]), "low_52w": min(x[3] for x in s[-250:]), "volume": s[-1][4],
                  "volume_avg20": round(sum(vols) / len(vols)) if vols else None, "rsi14": rsi14([x[1] for x in s]), "spark_1m": [x[1] for x in s[-21:]]}
    return out


def market_records(root: str, market: str, day: str) -> dict:
    cfg = yaml.safe_load(open(os.path.join(root, "config", "markets", f"{market}.yaml")))
    sector = {t: name for name, ts in cfg["sectors"].items() for t in ts}
    meta = cfg.get("company_meta", {})
    view = [r for r in jsonl(root, market, "strategy_predictions", day) if r["session_date"] == day and r["horizon_days"] == HORIZON]
    scores = {r["ticker"]: r for r in jsonl(root, market, "model_scores", day) if r["horizon_days"] == HORIZON}
    feats = {r["ticker"]: r for r in jsonl(root, market, "features", day)}
    results = {}
    for r in sorted(jsonl(root, market, "earnings_estimates", day), key=lambda r: r["report_date"]):
        if r["report_date"] > day:
            results.setdefault(r["ticker"], r["report_date"])
    shorts = {r["ticker"]: r for r in jsonl(root, market, "short_interest", day)} if market == "us" else {}
    prices = price_summary(root, market, list(sector), day) if market == "us" else {}
    out = {}
    for t in sector:
        mine = [r for r in view if r["ticker"] == t]
        fam = {}
        for r in mine:
            f = fam.setdefault(r["family"], {"buy": 0, "of": 0})
            f["of"] += 1
            f["buy"] += int(r["qualifies"] and r["direction"] == "up")
        f, s = feats.get(t, {}), scores.get(t)
        out[t] = {"name": (meta.get(t) or {}).get("name", t), "sector": sector[t],
                  "strategies": {"buy": sum(x["buy"] for x in fam.values()), "of": sum(x["of"] for x in fam.values()), "by_family": fam},
                  "prob_up": s["prob_up"] if s else None, "model_as_of": s["as_of_date"] if s else None,
                  "rsi14": round(f["rsi_14"], 1) if f.get("rsi_14") is not None else None, "beta_1y": round(f["beta_1y"], 2) if f.get("beta_1y") is not None else None,
                  "days_to_results": f.get("days_to_earnings"), "ex_dividend": f.get("ex_dividend_date"), "next_results": results.get(t),
                  **({"short_days_to_cover": shorts[t]["days_to_cover"], "short_change_pct": shorts[t]["change_pct"], "short_as_of": shorts[t]["settlement_date"]} if t in shorts else {}),
                  **({"prices": prices[t]} if t in prices else {})}
    return out


if __name__ == "__main__":
    root, day = sys.argv[1], sys.argv[2]
    data = {"day": day, "horizon_days": HORIZON, "source": "contactexepex/agentic-stock-prediction data/<market>/ (published records)",
            "markets": {m: market_records(root, m, day) for m in ("india", "us")}}
    with open(OUT, "w") as handle:
        json.dump(data, handle, indent=1, sort_keys=True)
        handle.write("\n")
    print({m: len(v) for m, v in data["markets"].items()})
