"""The forecast contest's scoring, written exactly as exepex/trading research/forecasts/PROTOCOL.md (draft version 1)
sections 7 and 8 say, for the mockup's labelled Example data only (design/mockups/37-forecasts).

The real numbers will come from story G4 (`fno/forecast/scoring.py`) through the read model; the dashboard never scores.
This copy exists so the Example states are internally consistent (every verdict follows from its own numbers by the
protocol's rule), not to be reused by the app. Deterministic: NumPy's generator seeded as the protocol says.
"""
from __future__ import annotations

import math

import numpy as np

BLOCK, RESAMPLES, SEED, MIN_DATES, ALPHA = 20, 10_000, 20261013, 40, 0.05
BINS = 10


def brier(p: float, o: int) -> float:
    return (p - o) ** 2


def log_score(p: float, o: int) -> float:
    q = min(max(p, 0.01), 0.99)
    return -math.log(q) if o else -math.log(1 - q)


def calibration(pairs: list) -> list:
    """10 fixed bins [0, 0.1) ... [0.9, 1.0]: count, mean forecast, observed frequency (protocol section 7)."""
    out = []
    for b in range(BINS):
        lo, hi = b / BINS, (b + 1) / BINS
        inside = [(p, o) for p, o in pairs if lo <= p < hi or (b == BINS - 1 and p == 1.0)]
        out.append({"bin": [round(lo, 1), round(hi, 1)], "n": len(inside),
                    "mean_p": round(sum(p for p, _ in inside) / len(inside), 3) if inside else None,
                    "freq": round(sum(o for _, o in inside) / len(inside), 3) if inside else None})
    return out


def block_bootstrap(diffs: np.ndarray, k: int) -> np.ndarray:
    """Moving-block bootstrap means: ceil(n/L) block starts from 0..n-L, joined in draw order, cut to n (section 8)."""
    n = len(diffs)
    rng = np.random.default_rng(np.random.SeedSequence([SEED, k]))
    starts = rng.integers(0, n - BLOCK + 1, size=(RESAMPLES, math.ceil(n / BLOCK)))
    idx = (starts[:, :, None] + np.arange(BLOCK)).reshape(RESAMPLES, -1)[:, :n]
    return diffs[idx].mean(axis=1)


def compare(a: dict, b: dict, outcomes: dict, k: int) -> dict:
    """Comparison k: mean Brier difference A - B on dates both forecast and resolved (negative favours A)."""
    dates = sorted(d for d in outcomes if a.get(d) is not None and b.get(d) is not None)
    row = {"k": k, "n_dates": len(dates)}
    if len(dates) < MIN_DATES:
        return {**row, "mean_diff": None, "ci": None, "p": 1.0, "status": "too_few_dates"}
    diffs = np.array([brier(a[d], outcomes[d]) - brier(b[d], outcomes[d]) for d in dates])
    mean, boot = float(diffs.mean()), block_bootstrap(diffs, k)
    p = (1 + int(np.sum(np.abs(boot - mean) >= abs(mean)))) / (RESAMPLES + 1)
    lo, hi = np.percentile(boot, [2.5, 97.5])
    return {**row, "mean_diff": round(mean, 4), "ci": [round(float(lo), 4), round(float(hi), 4)], "p": round(p, 4), "status": "tested"}


def holm(rows: list) -> None:
    """Holm's step-down over all rows' p-values at 5% family-wise; sets `significant` on each row in place."""
    order = sorted(range(len(rows)), key=lambda i: rows[i]["p"])
    stopped = False
    for rank, i in enumerate(order):
        stopped = stopped or rows[i]["p"] > ALPHA / (len(rows) - rank)
        rows[i]["significant"] = not stopped


def pairs_for(question: int, books: list, yardsticks: list) -> list:
    """The protocol's order: pairs 1-2, 1-3, 2-3, then each book against the first yardstick, then the second."""
    out = [(books[0], books[1]), (books[0], books[2]), (books[1], books[2])]
    for y in yardsticks:
        out += [(b, y) for b in books]
    return out
