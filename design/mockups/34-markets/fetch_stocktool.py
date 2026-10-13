"""Copy the stock tool's own published market records into source/stocktool.json (run by hand; reads only).

    python design/mockups/34-markets/fetch_stocktool.py <clone of contactexepex/agentic-stock-prediction> 2026-10-12

From config/markets/<market>.yaml: the instruments that are not companies (benchmark, volatility index, world markets,
currencies, commodities, yields, US sector funds) with their names and close times. From data/<market>/ up to the day:
- prices: a year of daily closes of those instruments;
- flows: FII/FPI and DII cash-market flows (NSE, provisional) and fpi: NSDL's FPI equity flows (India);
- events: every recorded event (results, ex-dividend; the latest record per id) from the day on;
- regime: the stock tool's reading of the session (calm, trending, event-heavy) and its notes;
- macro: the latest US Treasury par yields (US).
"""
import csv
import glob
import json
import os
import sys

import yaml

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source", "stocktool.json")
ROLES = ("benchmark", "vol_index", "cue", "factor", "fx", "sector_etf")


def records(root: str, market: str, name: str, day: str) -> list:
    files = sorted(f for f in glob.glob(os.path.join(root, "data", market, name, "*", "*", "*.jsonl")) if os.path.basename(f)[:10] <= day)
    return [json.loads(line) for f in files for line in open(f)]


def latest(rows: list, key: str = "id") -> list:
    return list({r[key]: r for r in rows}.values())


def instruments(root: str, market: str, day: str) -> dict:
    cfg = yaml.safe_load(open(os.path.join(root, "config", "markets", f"{market}.yaml")))
    found = {}

    def walk(node):
        if isinstance(node, dict):
            for k, v in node.items():
                if isinstance(v, dict) and v.get("role") in ROLES:
                    found[k] = {"name": v.get("name", k), "role": v["role"], "close_time": v.get("close_time"), "sectors": v.get("sectors")}
                else:
                    walk(v)
    walk(cfg)
    files = sorted(f for f in glob.glob(os.path.join(root, "data", market, "prices", "*", "*", "*.csv")) if os.path.basename(f)[:10] <= day)[-262:]
    series = {k: {} for k in found}
    for f in files:
        for r in csv.DictReader(open(f)):
            if r["ticker"] in series and r["close"]:
                series[r["ticker"]][r["date"]] = float(r["close"])
    return {k: {**v, "closes": sorted(series[k].items())} for k, v in found.items() if series[k]}


def market(root: str, m: str, day: str) -> dict:
    out = {"instruments": instruments(root, m, day),
           "events": sorted((r for r in latest(records(root, m, "events", day)) if r["date"] >= day), key=lambda r: (r["date"], r["id"])),
           "regime": (records(root, m, "regime", day) or [None])[-1]}
    if m == "india":
        out["flows"] = sorted(latest(records(root, m, "flows", day)), key=lambda r: (r["date"], r["category"]))
        out["fpi"] = sorted((r for r in latest(records(root, m, "fpi", day)) if r["asset_class"] == "Equity"), key=lambda r: (r["reporting_date"], r["route"]))
    else:
        macro = latest(records(root, m, "macro", day))
        last = max(r["date"] for r in macro)
        out["yields"] = sorted((r for r in macro if r["date"] == last and r["series"].startswith("UST_")), key=lambda r: r["id"])
    return out


if __name__ == "__main__":
    root, day = sys.argv[1], sys.argv[2]
    data = {"day": day, "source": "contactexepex/agentic-stock-prediction config/markets and data/<market>/ (published records)",
            "markets": {m: market(root, m, day) for m in ("india", "us")}}
    with open(OUT, "w") as handle:
        json.dump(data, handle, indent=1, sort_keys=True)
        handle.write("\n")
    print({m: {k: len(v) if isinstance(v, (list, dict)) else v for k, v in d.items()} for m, d in data["markets"].items()})
