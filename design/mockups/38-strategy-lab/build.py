"""Strategy lab mockup (owner, 13 Oct 2026: which family makes money on paper, and can it be trusted with real money).

    python design/mockups/38-strategy-lab/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

Composes `data.json` from design/mockups/_platform/lab_data.py: the REAL state (the stock tool's settled paper trades in
source/settled.json, copied read-only by fetch_trades.py; no F&O paper trade exists yet) and labelled EXAMPLE states of
made-up trades on future dates (lab_example.py). Inlines it with 30-shell/data.json and the page's own js/*.js into
`template.html`; writes `page.html`. Deterministic.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from lab_data import lab_payload  # noqa: E402
from platform_build import run  # noqa: E402


def compose() -> dict:
    return {"_mock": True, "_note": "REAL STATE (the stock tool's settled paper trades up to 13 Oct 2026; no F&O paper trade yet) and EXAMPLE "
            "states of made-up trades on future dates, in the dashboard's proposed Strategy lab contract (notes.md). Paper only.",
            "page": "strategy-lab", "spec": "owner's brief of 13 Oct 2026; stock tool SPEC F7; exepex/trading DESK_DESIGN 12", **lab_payload()}


def summary(shell, data):
    return "; ".join(f"{k}: {s['days']} days" for k, s in data["states"].items())


if __name__ == "__main__":
    run(HERE, summary, compose=compose)
