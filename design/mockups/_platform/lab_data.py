"""Payload of the Strategy lab mockup (design/mockups/38-strategy-lab; owner, 13 Oct 2026: "which strategy is doing
well ... since beginning and for a range ... stocks and F&O separately and combined ... whether I should trust the system
with real money").

States: REAL (the stock tool's real settled paper trades, copied by 38-strategy-lab/fetch_trades.py: on 13 Oct 2026 only
39 baseline trades have settled; no F&O paper trade exists before slice 3) and two labelled EXAMPLES from
lab_example.py (made-up trades on future dates). Readiness for real money follows each backend's own written bar: the
stock tool's go-live bar (SPEC F7.2) and the F&O desk's evaluation rules (DESK_DESIGN 12.1, 12.8).
"""
from __future__ import annotations

import datetime as dt
import json
import os

import numpy as np

from lab_example import example
from nse_calendar import sessions
from real_data import display_names

HERE = os.path.dirname(os.path.abspath(__file__))
SETTLED = os.path.join(os.path.dirname(HERE), "38-strategy-lab", "source", "settled.json")
FAMILIES = [{"id": "rule", "name": "Rule-based"}, {"id": "hybrid", "name": "Hybrid"}, {"id": "ai", "name": "AI team"}]
MARKETS = {"india": {"currency": "INR", "per_trade": 100000, "fno_capital": 500000, "assets": ["stocks", "fno"]},
           "us": {"currency": "USD", "per_trade": 1000, "assets": ["stocks"]}}


def bootstrap_excludes_zero(rets: list, seed: int = 7) -> bool | None:
    """Percentile bootstrap (2,000 resamples) of the mean return per trade: True when the whole 95% range is above 0."""
    if len(rets) < 20:
        return None
    a = np.array(rets)
    means = np.random.default_rng(seed).choice(a, (2000, len(a))).mean(axis=1)
    return bool(np.percentile(means, 2.5) > 0)


def daily(trades: list, costs: list) -> dict:
    """{day: profit after every cost}: the trades closed that day after market charges, less the owner's own charges and
    the AI and data costs of that day (judge 55: the verdict is net after execution and operating costs)."""
    out = {}
    for t in trades:
        out[t[1]] = out.get(t[1], 0.0) + t[3]
    for d, own, ai_data in costs:
        out[d] = out.get(d, 0.0) - own - ai_data
    return out


def drawdown(by_day: dict) -> float:
    run = peak = worst = 0.0
    for d in sorted(by_day):
        run += by_day[d]
        peak = max(peak, run)
        worst = min(worst, run - peak)
    return round(worst, 2)


def check(key, label, ok, value, need):
    return {"key": key, "label": label, "ok": ok, "value": value, "need": need}


def readiness(trades: list, costs: list | None, asset: str, m: str, stormy: list, best_baseline: float | None) -> list:
    """Each condition of the written bar, met or not, with the family's own number beside the need. Every money check is
    on profit after every cost; without published costs (the real stock records today) no money check is ticked."""
    if not trades:
        return []
    days = max(t[1] for t in trades) - min(t[0] for t in trades) + 1
    n, priced = len(trades), costs is not None
    by_day = daily(trades, costs or [])
    net = sum(by_day.values())
    extra = sum(own + ai for _, own, ai in costs or []) / n
    luck = bootstrap_excludes_zero([t[3] - extra for t in trades]) if priced else None
    storm_days = [d for d in by_day if stormy[0] <= d <= stormy[1]]
    calm, storm = sum(v for d, v in by_day.items() if d not in storm_days), sum(by_day[d] for d in storm_days)
    both = [calm > 0, storm > 0] if storm_days and priced else None
    money = lambda ok: ok if priced else None
    luck_value = "passes" if luck else "not yet" if luck is None else "fails"
    if asset == "stocks":
        limit = 10 * MARKETS[m]["per_trade"]
        return [check("months", "Two months of paper trading", days >= 42, f"{days / 21:.1f} months", "2 months"),
                check("trades", "About 300 trades", n >= 300, f"{n} trades", "300 trades"),
                check("beats", "Beats the simple alternatives", None if best_baseline is None else money(net > best_baseline), round(net, 2), best_baseline),
                check("luck", "Not luck", luck, luck_value, "the luck test"),
                check("drawdown", "Losses stay within the limit", money(-drawdown(by_day) <= limit), -drawdown(by_day), limit),
                check("regimes", "Works in calm and stormy markets", None if both is None else all(both), [round(calm, 2), round(storm, 2)], "profit in both")]
    worst = min(t[3] for t in trades)
    return [check("months", "Six months of paper trading", days >= 126, f"{days / 21:.1f} months", "6 months"),
            check("profit", "Net profit after every cost", money(net > 0), round(net, 2), 0),
            check("risk", "Kept the risk rules", worst >= -10000, round(worst, 2), -10000),
            check("luck", "Not luck", luck, luck_value, "the evaluation test"),
            check("regimes", "Works in calm and stormy markets", None if both is None else all(both), [round(calm, 2), round(storm, 2)], "profit in both")]


def best_baseline(base: list, costs: list | None) -> float | None:
    """The best baseline strategy's profit after its own charges (baselines carry no AI or data cost)."""
    if not base:
        return None
    own = sum(r[1] for r in costs or []) / len(base)
    by_strategy = {}
    for t in base:
        by_strategy[t[6]] = by_strategy.get(t[6], 0) + t[3] - own
    return round(max(by_strategy.values()), 2)


def with_readiness(state: dict) -> dict:
    costs = state.get("costs")
    for m, assets in state["trades"].items():
        for asset, fams in assets.items():
            C = None if costs is None else costs[m][asset]
            best = best_baseline(fams.get("baseline", []), None if C is None else C.get("baseline", []))
            state.setdefault("ready", {}).setdefault(m, {})[asset] = {f["id"]: readiness(fams.get(f["id"], []), None if C is None else C.get(f["id"], []), asset, m, state["stormy"], best)
                                                                      for f in FAMILIES}
    return state


def real_state() -> dict:
    with open(SETTLED, encoding="utf-8") as handle:
        src = json.load(handle)
    rows = [r for rs in src["markets"].values() for r in rs]
    first = min((r["entry_date"] for r in rows), default=src["until"])
    dates = [d.isoformat() for d in sessions(dt.date.fromisoformat(first), dt.date.fromisoformat(src["until"]))]
    ix = {d: i + 1 for i, d in enumerate(dates)}
    trades = {m: {"stocks": {}} for m in MARKETS}
    for m, rs in src["markets"].items():
        names = display_names(m)
        for r in rs:
            trades[m]["stocks"].setdefault(r["family"], []).append([ix[r["entry_date"]], ix[r["exit_date"]], r["ticker"], r["net_pnl"], r["return_pct"], r["reason_code"],
                                                                     names.get(r["strategy_id"], r["strategy_id"])])
    trades["india"]["fno"] = {}
    return {"kind": "real", "as_of": src["until"], "days": len(dates), "dates": dates, "stormy": [0, -1], "index": None, "trades": trades,
            "costs": None,   # data gap: the stock tool publishes neither your-cost charges on settled trades nor AI and data costs per family
            "fno_reason": "No F&O paper trade exists yet. The three books start paper trading in build slice 3, after the first "
                          "experiment is agreed (it waits for the outside review) and the paper desk is built."}


def lab_payload() -> dict:
    ex = lambda d, k: with_readiness({"kind": "example", "example": k, **example(d)})
    return {"families": FAMILIES, "markets": MARKETS,
            "standing": "Paper trading only: no real money is used. Profit is after every charge (brokerage, taxes, fees).",
            "states": {"real": with_readiness(real_state()), "early": ex(30, "early"), "review": ex(160, "review")}}
