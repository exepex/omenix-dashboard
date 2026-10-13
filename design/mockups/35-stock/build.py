"""Stock page mockup (design/PLATFORM_DESIGN.md section 4 screen 4; orchestrator brief of 13 Oct 2026).

    python design/mockups/35-stock/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

Composes `data.json` from design/mockups/_platform/stock_data.py: REAL records (the stock tool's own published data of
RELIANCE and NVDA up to 13 Oct 2026 14:30 IST, in source/, copied read-only by fetch_stock.py; NSE's F&O files from
the screener's source). Inlines it with 30-shell/data.json into `template.html`; writes `page.html`. Deterministic.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from platform_build import run  # noqa: E402
from stock_data import stock_payload  # noqa: E402


def compose() -> dict:
    return {"_mock": True, "_note": "REAL RECORDS (the stock tool's published data; NSE's F&O files) in the dashboard's proposed stock-page "
            "contract. Neither backend publishes these rows as one page yet. Research and paper trading only.",
            "page": "stock", "spec": "design/PLATFORM_DESIGN.md section 4 #4; orchestrator brief 13 Oct 2026", **stock_payload()}


def summary(shell, data):
    return "; ".join(f"{m}: {s['ticker']} {s['quote']['close']}, P/E {s['valuation']['pe']}, {len(s['news'])} news, "
                     f"{len(s['trades'])} open strategy trades{', F&O' if s['fno'] else ''}" for m, s in data["markets"].items())


if __name__ == "__main__":
    run(HERE, summary, compose=compose)
