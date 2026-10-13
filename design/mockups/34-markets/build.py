"""Markets overview mockup (design/PLATFORM_DESIGN.md section 4 screen 2; orchestrator brief of 13 Oct 2026).

    python design/mockups/34-markets/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

Composes `data.json` from design/mockups/_platform/markets_data.py: REAL data of Mon 12 Oct 2026 (NSE's daily index,
equity and F&O files; the stock tool's own market records), all in source/ folders fetched by hand. Inlines it with
30-shell/data.json into `template.html`; writes `page.html`. Deterministic (no network).
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from markets_data import markets_payload  # noqa: E402
from platform_build import run  # noqa: E402


def compose() -> dict:
    return {"_mock": True, "_note": "REAL DATA of 12 Oct 2026 (NSE daily files; the stock tool's published records) in the dashboard's proposed "
            "market-overview contract. Neither backend publishes these rows yet. Research and paper trading only.",
            "page": "markets", "spec": "design/PLATFORM_DESIGN.md section 4 #2; orchestrator brief 13 Oct 2026", **markets_payload()}


def summary(shell, data):
    i, u = data["markets"]["india"], data["markets"]["us"]
    return (f"{data['day']}: India {len(i['indices']['rows'])} indices, {len(i['sectors'])} industries, {len(i['world'])} world quotes, "
            f"{len(i['events'])} events; US {len(u['sectors'])} sector funds, {len(u['yields'])} yields")


if __name__ == "__main__":
    run(HERE, summary, compose=compose)
