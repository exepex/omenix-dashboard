"""The Forecast contest's overview, from settled forecasts (owner's feedback of 13 Oct 2026: one race chart of all
families together, by day, week and month; who wins, who loses and why; each family against each other).

Everything here is descriptive and derived only from what each forecaster said and what happened, never from how it
forecasts (owner: strategy internals stay private). The tested verdicts stay those of the protocol (forecast_scoring.py);
these views are shown, not tested, and the screen says so. In the app the F&O tool would publish them (proposed
contract, 37-forecasts/notes.md); the mockup computes them for its Example states.
"""
from __future__ import annotations

from forecast_scoring import brier, calibration

REF = "baseline_b"   # "How often it happened": the one yardstick that answers all five questions


def points(p: float, ref: float, o: int) -> float:
    """Points for one settled forecast: 100 x (the yardstick's miss score - the forecaster's). Above 0: it missed less."""
    return round((brier(ref, o) - brier(p, o)) * 100, 2)


def settled(said: dict, outcomes: dict) -> list:
    return [(d, said[d], o) for d, o in sorted(outcomes.items()) if said.get(d) is not None]


def traits(rows: list) -> dict:
    """What a forecaster's own outputs show: miss score, leaning the right way, how bold, how honest about its confidence."""
    if not rows:
        return {"n": 0}
    pairs = [(p, o) for _, p, o in rows]
    right = sum(1.0 if (p > 0.5) == bool(o) else 0.5 if p == 0.5 else 0.0 for p, o in pairs)
    bins = [b for b in calibration(pairs) if b["n"]]
    gap = sum(abs(b["mean_p"] - b["freq"]) * b["n"] for b in bins) / len(pairs)
    return {"n": len(pairs), "brier": round(sum(brier(p, o) for p, o in pairs) / len(pairs), 4),
            "right_pct": round(100 * right / len(pairs), 1), "bold_pct": round(100 * sum(abs(p - 0.5) * 2 for p, _ in pairs) / len(pairs), 1),
            "honesty_gap": round(100 * gap, 1)}


def head_to_head(a: dict, b: dict, raw: dict) -> dict:
    """Over every question and day both forecast: how often A missed less than B, and the average gap in points."""
    wins = n = 0
    gap = 0.0
    for qid, (said, outcomes) in raw.items():
        for d, o in outcomes.items():
            pa, pb = said.get(a, {}).get(d), said.get(b, {}).get(d)
            if pa is None or pb is None:
                continue
            n += 1
            ga, gb = brier(pa, o), brier(pb, o)
            wins += 1 if ga < gb else 0.5 if ga == gb else 0
            gap += (gb - ga) * 100
    return {"n": n, "win_pct": round(100 * wins / n, 1) if n else None, "points_per_forecast": round(gap / n, 2) if n else None}


def overview(raw: dict, families: list, yardsticks: list, questions: list) -> dict:
    """raw: {question id: (said {forecaster: {day: p}}, outcomes {day: 0 or 1})}."""
    fams = [f["id"] for f in families]
    table, race, misses = {}, {}, {}
    for fid in fams + [y["id"] for y in yardsticks]:
        per_q, rows_all = {}, []
        for q in questions:
            said, outcomes = raw[q["id"]]
            if fid not in said or not said[fid]:
                continue
            rows = settled(said[fid], outcomes)
            rows_all += [(d, p, o, q["id"]) for d, p, o in rows]
            t = traits(rows)
            if fid in fams and rows:
                pts = [points(p, said[REF][d], o) for d, p, o in rows if said[REF].get(d) is not None]
                t["points_per_forecast"] = round(sum(pts) / len(pts), 2) if pts else None
                race.setdefault(fid, {})[q["id"]] = [[d, points(p, said[REF][d], o)] for d, p, o in rows if said[REF].get(d) is not None]
            per_q[q["id"]] = t
        table[fid] = {**traits([(d, p, o) for d, p, o, _ in rows_all]), "questions": per_q}
        if fid in fams and rows_all:
            pts = [x[1] for xs in race.get(fid, {}).values() for x in xs]
            table[fid].update(points=round(sum(pts), 1), gains=round(sum(x for x in pts if x > 0), 1), losses=round(sum(x for x in pts if x < 0), 1),
                              wins=sum(x > 0 for x in pts), defeats=sum(x < 0 for x in pts))
            worst = sorted(rows_all, key=lambda r: -brier(r[1], r[2]))[:3]
            misses[fid] = [{"day": d, "question": qid, "said": p, "outcome": o, "miss": round(brier(p, o), 3)} for d, p, o, qid in worst]
    running = [f for f in fams if table[f].get("n")]
    h2h = {a: {b: head_to_head(a, b, raw) for b in running if b != a} for a in running}
    return {"ref": REF, "table": table, "race": race, "h2h": h2h, "misses": misses}
