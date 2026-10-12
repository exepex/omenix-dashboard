"""Dashboard (Home) mockup (design/PLATFORM_DESIGN.md section 4 screen 1; mockup order item 2; owner feedback 13 Oct 2026).

    python design/mockups/31-dashboard/build.py [--out DIR]

Inlines this folder's `data.json` (Mock: accounts, positions, ideas, decisions, events, news) and the shell's
30-shell/data.json (prices, watchlists, search) into `template.html` with the design system, the
page helpers and the platform runtime (design/mockups/_platform/), and writes `page.html`. Deterministic.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from platform_build import run  # noqa: E402


def summary(shell, data):
    return "; ".join(f"{m}: {len(p['accounts'])} accounts, {len(p['positions'])} positions, {len(p['stock_ideas'])} stock ideas, "
                     f"{len(p['fno_ideas'])} F&O ideas" for m, p in data["markets"].items())


if __name__ == "__main__":
    run(HERE, summary)
