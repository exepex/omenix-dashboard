"""EXAMPLE states of the Forecast contest mockup: synthetic forecasts and outcomes, scored by the protocol's own rules
(forecast_scoring.py), so the API contract and the developer see every shape the data can take (owner, 13 Oct 2026).

Nothing here is real or comes from real NIFTY or India VIX closes: the outcomes are coin flips from a made-up chance
that drifts day by day. Days are numbered ("day 45"), never dated, so no example can be mistaken for history.
- "early": day 45. Rule-based running from day 1, Hybrid from day 30, AI team not running yet: too few settled days.
- "review": day 150, past the first review. Hybrid reads the made-up chance closely (winning), AI team is too sure of
  itself (losing), Rule-based sits near the yardsticks. AI team misses 4 days ("no forecast", counted, never scored).
"""
from __future__ import annotations

import math

import numpy as np

from forecast_scoring import brier, calibration, compare, holm, log_score, pairs_for
from forecast_views import overview

SEED = 20261013
PLAN = {"early": {"days": 45, "start": {"book1_rules": 1, "book2_hybrid": 30}, "review": False},
        "review": {"days": 150, "start": {"book1_rules": 1, "book2_hybrid": 1, "book3_ai": 1}, "review": True}}
BASE = [0.1, -0.3, -0.2, -0.1, 0.6]       # each question's long-run lean, in log-odds (made up)
SKILL = {"book1_rules": (0.55, 0.45), "book2_hybrid": (0.95, 0.12), "book3_ai": (3.2, 1.0),   # (how closely, noise)
         "baseline_a": (0.5, 0.45), "baseline_c": (0.5, 0.4)}
MISSED = {"book3_ai": {40, 77, 78, 121}}
ROLL = 20


def sig(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def made_up_chance(rng, days: int) -> np.ndarray:
    x, out = 0.0, []
    for _ in range(days):
        x = 0.93 * x + 0.35 * rng.standard_normal()
        out.append(x)
    return np.array(out)


def forecasts(rng, fid: str, base: float, drift: np.ndarray, start: int) -> dict:
    """{day: probability or None}: what a forecaster said each day it ran."""
    out = {}
    for t, x in enumerate(drift, 1):
        if t < start:
            continue
        if fid == "baseline_b":
            p = sig(base) + 0.01 * math.sin(t / 15)
        elif fid == "book3_ai":
            gain, noise = SKILL[fid]
            p = sig(base + gain * (x + noise * rng.standard_normal()))
        else:
            gain, noise = SKILL[fid]
            p = sig(base + gain * x + noise * rng.standard_normal())
        out[t] = None if t in MISSED.get(fid, ()) else round(min(max(p, 0.01), 0.99), 3)
    return out


def scores(said: dict, outcomes: dict, flagged: set | None) -> dict:
    pairs = [(said[d], outcomes[d]) for d in sorted(outcomes) if said.get(d) is not None]
    row = {"n_forecasts": sum(p is not None for p in said.values()), "n_no_forecast": sum(p is None for p in said.values()),
           "n_scored": len(pairs), "brier": round(sum(brier(p, o) for p, o in pairs) / len(pairs), 4) if pairs else None,
           "log": round(sum(log_score(p, o) for p, o in pairs) / len(pairs), 4) if pairs else None, "calibration": calibration(pairs)}
    if flagged is not None:
        part = lambda keep: [brier(said[d], outcomes[d]) for d in outcomes if said.get(d) is not None and (d in flagged) == keep]
        row["split"] = {k: {"n": len(v), "brier": round(sum(v) / len(v), 4) if v else None} for k, v in (("interpolated", part(False)), ("flagged", part(True)))}
    return row


def rolling(said: dict, outcomes: dict) -> list:
    """[[day, mean Brier of the last 20 settled days]] from the 20th settled day on."""
    pts, run = [], []
    for d in sorted(outcomes):
        if said.get(d) is not None:
            run.append(brier(said[d], outcomes[d]))
            if len(run) >= ROLL:
                pts.append([d, round(sum(run[-ROLL:]) / ROLL, 4)])
    return pts


def verdict(row: dict, review: bool) -> str:
    if row["status"] != "tested":
        return row["status"]
    if not review:
        return "before_review"
    if not row["significant"]:
        return "no_difference"
    return "better" if row["mean_diff"] < 0 else "worse"


def question_block(rng, q: dict, qi: int, plan: dict, ids: list, k0: int) -> tuple:
    days, h = plan["days"], q["days"]
    drift = made_up_chance(rng, days)
    truth = [sig(BASE[qi] + x) for x in drift]
    void = {days - h - 3} if qi == 4 else set()
    outcomes = {t: int(rng.random() < truth[t - 1]) for t in range(1, days - h + 1) if t not in void}
    flagged = {t for t in range(1, days + 1) if t % 11 == 0} if qi == 4 else None
    said = {f: forecasts(rng, f, BASE[qi], drift, plan["start"].get(f, 1 if f.startswith("baseline") else days + 1))
            for f in ids if not f.startswith("baseline") or f in q["yardsticks"]}
    rows = []
    for k, (a, b) in enumerate(pairs_for(qi, ids[:3], q["yardsticks"]), k0):
        running = said[a] and said[b]
        rows.append({"a": a, "b": b, **(compare(said[a], said[b], outcomes, k) if running else
                                        {"k": k, "n_dates": 0, "mean_diff": None, "ci": None, "p": 1.0, "status": "not_running"})})
    recent = [{"day": d, "said": {f: said[f].get(d) for f in said}, "outcome": outcomes[d]} for d in sorted(outcomes)[-6:]][::-1]
    return {"made": days, "resolves": days + h, "void": len(void),
            "today": {f: said[f].get(days) for f in said},
            "scores": {f: scores(said[f], outcomes, flagged) for f in said if said[f]},
            "rolling": {f: rolling(said[f], outcomes) for f in said if said[f]},
            "recent": recent}, rows, (said, outcomes)


def example(kind: str, questions: list, families: list, yardsticks: list) -> dict:
    plan, rng = PLAN[kind], np.random.default_rng(np.random.SeedSequence([SEED, len(kind)]))
    ids = [f["id"] for f in families] + [y["id"] for y in yardsticks]
    blocks, rows, raw = {}, [], {}
    for qi, q in enumerate(questions):
        blocks[q["id"]], qrows, raw[q["id"]] = question_block(rng, q, qi, plan, ids, len(rows) + 1)
        rows += [{**r, "question": q["id"]} for r in qrows]
    holm(rows)
    for r in rows:
        r["verdict"] = verdict(r, plan["review"])
        blocks[r.pop("question")].setdefault("comparisons", []).append(r)
    started = {f: plan["start"].get(f, 1 if f.startswith("baseline") else None) for f in ids}
    return {"kind": "example", "example": kind, "as_of": None, "day": plan["days"],
            "protocol": {"version": "1", "status": "frozen", "frozen_commit": "example"},
            "review": {"reached": plan["review"], "date": None, "day": 126 if plan["review"] else None},
            "forecasters": {f: {"status": "running" if s else "not_running", "days": plan["days"] - s + 1 if s else 0,
                                "with_forecast": (plan["days"] - s + 1 - len(MISSED.get(f, ()))) if s else 0} for f, s in started.items()},
            "questions": blocks, "overview": overview(raw, families, yardsticks, questions)}
