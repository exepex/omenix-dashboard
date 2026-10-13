"""Forecast contest mockup (exepex/trading docs/BUILD_MAP.md slice 2; orchestrator brief of 13 Oct 2026).

    python design/mockups/37-forecasts/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

Composes `data.json` from design/mockups/_platform/forecast_data.py: the REAL state of 13 Oct 2026 (no forecast exists;
the steps it waits for, from exepex/trading's stories G1-G5) and labelled EXAMPLE states made from synthetic numbers and
scored by the protocol's own rules (forecast_example.py, forecast_scoring.py). Inlines it with 30-shell/data.json and the
page's own js/*.js into `template.html`; writes `page.html`. Deterministic.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from forecast_data import forecast_payload  # noqa: E402
from platform_build import run  # noqa: E402


def compose() -> dict:
    return {"_mock": True, "_note": "REAL STATE (no forecast exists on 13 Oct 2026) and EXAMPLE states with made-up numbers, in the "
            "dashboard's proposed forecast-contest contract (notes.md). Not published by the F&O tool yet. Research and paper only.",
            "page": "forecasts", "spec": "exepex/trading docs/BUILD_MAP.md slice 2; research/forecasts/PROTOCOL.md draft 1", **forecast_payload()}


def summary(shell, data):
    return "; ".join(f"{k}: day {s['day']}, {len(s['questions'])} questions scored" for k, s in data["states"].items())


if __name__ == "__main__":
    run(HERE, summary, compose=compose)
