"""Copy the stock tool's own published records of one company per market into source/stock.json (run by hand; reads only).

    python design/mockups/35-stock/fetch_stock.py <clone of contactexepex/agentic-stock-prediction> 2026-10-13T09:00:00Z RELIANCE NVDA

Everything recorded up to the clock (UTC), from data/<market>/:
- prices: two years of daily OHLCV of the company and its benchmark (NIFTY 50, the S&P 500 fund);
- intraday_checks: the last price check;
- features, model_scores, ranges, strategy_predictions, cost_views, agent_reasoning: the tools' latest view (the AI
  team's reasoning is copied as written; no model is named: strategies are listed by id, the dashboard names them);
- trade_checks: the strategies' open paper trades in the company, at the last check;
- model_market: every company's model chance on the same day and the model version's calibration slope (page honesty:
  how many companies get the same chance);
- news_clusters, news_verified, news (headlines), news_claims: the 40 latest stories of the last 30 days with how far each is confirmed;
- events, earnings_estimates, financials (India) or fundamentals (US), delivery (India), announcements and deals
  (India), holdings (pledges in India, 13F filers in the US), insiders and short_interest (US).
"""
import csv
import glob
import json
import os
import re
import sys

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source", "stock.json")
BENCH = {"india": "NIFTY50", "us": "SPY"}
MODEL_WORDS = re.compile(r"\b(sonnet|opus|haiku|claude|gpt-?\d*|gemini|llama)\b", re.I)


def records(root, m, name, until, ticker=None, key="id"):
    """The latest record per id among the daily files up to the clock (a record is restated in later files)."""
    day = until[:10]
    out = {}
    for f in sorted(glob.glob(os.path.join(root, "data", m, name, "*", "*", "*.jsonl"))):
        if os.path.basename(f)[:10] > day:
            continue
        for line in open(f):
            r = json.loads(line)
            if ticker and r.get("ticker") != ticker and ticker not in (r.get("tickers") or []):
                continue
            stamp = r.get("made_at") or r.get("computed_at") or r.get("as_of") or r.get("first_seen_at") or r.get("check_at") or ""
            if stamp and stamp > until:
                continue
            out[r.get(key) or len(out)] = r
    return list(out.values())


def prices(root, m, tickers, until):
    out = {t: [] for t in tickers}
    for f in sorted(glob.glob(os.path.join(root, "data", m, "prices", "*", "*", "*.csv"))):
        if os.path.basename(f)[:10] >= until[:10]:
            continue                                   # today's close is not in until after the close
        for r in csv.DictReader(open(f)):
            if r["ticker"] in out and r["close"]:
                out[r["ticker"]].append([r["date"], *(round(float(r[k]), 2) for k in ("open", "high", "low", "close")), int(float(r["volume"] or 0))])
    return {t: sorted({x[0]: x for x in v}.values()) for t, v in out.items()}


def latest(rows, key):
    return max(rows, key=lambda r: r[key]) if rows else None


def scrub(text):
    return MODEL_WORDS.sub("AI", text) if isinstance(text, str) else text


def company(root, m, t, until):
    feats = records(root, m, "features", until, t)
    scores = records(root, m, "model_scores", until, t)
    last_asof = max((r["as_of_date"] for r in scores), default=None)
    ranges = records(root, m, "ranges", until, t)
    last_session = max((r["session_date"] for r in ranges), default=None)
    views = records(root, m, "strategy_predictions", until, t)
    view_session = max((r["session_date"] for r in views), default=None)
    reasoning = latest(records(root, m, "agent_reasoning", until, t), "made_at")
    checks = records(root, m, "trade_checks", until, t)
    last_check = max((r["check_at"] for r in checks), default=None)
    clusters = sorted((c for c in records(root, m, "news_clusters", until, t, key="cluster_id") if c["last_reported_at"][:10] >= day_minus(until, 30)),
                      key=lambda c: c["last_reported_at"], reverse=True)[:40]    # the 40 latest stories of the last 30 days
    verified = {r["cluster_id"]: r for r in records(root, m, "news_verified", until, t, key="cluster_id")}
    item_ids = {i for c in clusters for i in c["news_ids"]}
    items = {r["id"]: r for r in records(root, m, "news", until) if r.get("id") in item_ids}
    claims = [r for r in records(root, m, "news_claims", until, t, key="fact_key") if r.get("cluster_id") in {c["cluster_id"] for c in clusters}]
    out = {
        "intraday": latest(records(root, m, "intraday_checks", until, t), "check_at"),
        "features": latest(feats, "as_of_date"),
        "model": sorted((r for r in scores if r["as_of_date"] == last_asof), key=lambda r: r["horizon_days"]),
        "ranges": sorted((r for r in ranges if r["session_date"] == last_session), key=lambda r: r["horizon_days"]),
        "views": sorted((r for r in views if r["session_date"] == view_session), key=lambda r: (r["horizon_days"], r["strategy_id"])),
        "costs": [r for r in records(root, m, "cost_views", until, t) if r.get("session_date") == view_session and r["record_kind"] == "prediction"],
        "settled": [r for r in records(root, m, "cost_views", until, t) if r.get("net_pnl_market") is not None],
        "reasoning": {k: scrub(v) for k, v in reasoning.items()} if reasoning else None,
        "open_trades": [r for r in checks if r["check_at"] == last_check],
        "news": [{"cluster_id": c["cluster_id"], "first": c["first_reported_at"], "last": c["last_reported_at"], "outlets": c["outlets"], "n": c["n_items"],
                  "flags": c["flags"], "status": (verified.get(c["cluster_id"]) or {}).get("status"),
                  "title": next((items[i].get("title") for i in c["news_ids"] if i in items), None),
                  "url": next((items[i].get("url") for i in c["news_ids"] if i in items), None)} for c in clusters],
        "claims": [{k: scrub(r.get(k)) for k in ("cluster_id", "claim_type", "subject", "predicate", "stance", "quote")} for r in claims],
        "events": [r for r in records(root, m, "events", until, t) if r["date"] >= day_minus(until, 0)],
        "earnings": sorted(records(root, m, "earnings_estimates", until, t), key=lambda r: r["report_date"])[-10:],
        "holdings": records(root, m, "holdings", until, t),
    }
    if m == "india":
        out["financials"] = records(root, m, "financials", until, t)
        out["delivery"] = sorted(records(root, m, "delivery", until, t), key=lambda r: r["date"])[-10:]
        out["announcements"] = sorted(records(root, m, "announcements", until, t), key=lambda r: r["published_at"])[-10:]
        out["deals"] = records(root, m, "deals", until, t)
    else:
        out["fundamentals"] = [r for r in records(root, m, "fundamentals", until, t) if r["concept"] in ("eps_diluted", "revenue", "net_income", "shares_diluted_avg")]
        out["insiders"] = records(root, m, "insiders", until, t)
        out["short_interest"] = sorted(records(root, m, "short_interest", until, t), key=lambda r: r["settlement_date"])[-6:]
    return out


def model_market(root, m, until):
    """Every company's model chance on the latest scoring day, per horizon, and the calibration slope of the model
    version in use (0 means calibration flattens the features: only the base rate and news move the chance)."""
    scores = records(root, m, "model_scores", until)
    asof = max((r["as_of_date"] for r in scores), default=None)
    chances = {}
    for r in scores:
        if r["as_of_date"] == asof:
            chances.setdefault(str(r["horizon_days"]), {})[r["ticker"]] = r["prob_up"]
    versions = {}
    for r in sorted(records(root, m, "model_versions", until), key=lambda r: r["fitted_at"]):
        versions[str(r["horizon_days"])] = {"version": r["id"], "platt_slope": r.get("platt_slope")}
    return {"as_of_date": asof, "chances": chances, "versions": versions}


def day_minus(until, days):
    import datetime as dt
    return (dt.date.fromisoformat(until[:10]) - dt.timedelta(days=days)).isoformat()


if __name__ == "__main__":
    root, until, india, us = sys.argv[1:5]
    data = {"until": until, "source": "contactexepex/agentic-stock-prediction data/<market>/ (published records)", "markets": {}}
    for m, t in (("india", india), ("us", us)):
        data["markets"][m] = {"ticker": t, "prices": prices(root, m, [t, BENCH[m]], until), "benchmark": BENCH[m], **company(root, m, t, until),
                             "model_market": model_market(root, m, until)}
    text = json.dumps(data, indent=1, sort_keys=True, default=str)
    assert not MODEL_WORDS.search(text.replace(".sonnet.", ".").replace(".opus.", ".")), "a model name in the copied text"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as handle:
        handle.write(text + "\n")
    print({m: {k: len(v) if isinstance(v, (list, dict)) else bool(v) for k, v in d.items()} for m, d in data["markets"].items()})
