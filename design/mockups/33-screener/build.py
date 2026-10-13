"""Screener mockup (design/PLATFORM_DESIGN.md section 4 screen 8; orchestrator brief and owner decisions of 13 Oct 2026).

    python design/mockups/33-screener/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

Composes `data.json` from design/mockups/_platform/screener_data.py: REAL data of Mon 12 Oct 2026 (NSE's daily
equity and F&O files, and the stock tool's own records of its 20 companies per market, in source/, fetched by hand
with fetch_nse.py and fetch_tracked.py). Inlines it with 30-shell/data.json into `template.html`; writes `page.html`.
Deterministic (no network).
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from platform_build import run  # noqa: E402
from screener_data import screener_payload  # noqa: E402


def compose() -> dict:
    return {"_mock": True, "_note": "REAL DATA of 12 Oct 2026 (NSE daily files; the stock tool's published records) in the dashboard's proposed "
            "screener contract. Neither backend publishes screener rows yet. Research and paper trading only.",
            "page": "screener", "spec": "design/PLATFORM_DESIGN.md section 4 #8; owner decisions 13 Oct 2026", **screener_payload()}


def summary(shell, data):
    i, u = data["markets"]["india"], data["markets"]["us"]
    return f"{data['day']}: India {len(i['stocks'])} stocks, {len(i['fno'])} F&O underlyings; US {len(u['stocks'])} stocks"


if __name__ == "__main__":
    run(HERE, summary, compose=compose)
