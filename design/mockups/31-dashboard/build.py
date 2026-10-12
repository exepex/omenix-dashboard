"""Home mockup (design/PLATFORM_DESIGN.md section 4 screen 1; owner feedback of 13 Oct 2026).

    python design/mockups/31-dashboard/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

Composes `data.json` from the application's own example records (design/mockups/_platform/real_data.py) and inlines
it with 30-shell/data.json into `template.html`; writes `page.html`. Deterministic.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from platform_build import SHELL_DATA, run  # noqa: E402
from real_data import home_payload  # noqa: E402


def summary(shell, data):
    return "; ".join(f"{m}: {len(p['groups'])} groups, {len(p['own'])} own and {len(p['strategy_trades'])} strategy trades open, "
                     f"{len(p['attention'])} items need you" for m, p in data["markets"].items())


if __name__ == "__main__":
    with open(SHELL_DATA, encoding="utf-8") as handle:
        run(HERE, summary, compose=lambda: home_payload(json.load(handle)))
