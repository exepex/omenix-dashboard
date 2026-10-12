"""Platform shell mockup (design/PLATFORM_DESIGN.md sections 2, 3, 5 and 6; owner feedback of 13 Oct 2026).

    python design/mockups/30-shell/build.py [--out DIR]

Composes `data.json` from the application's own example records (design/mockups/_platform/real_data.py: companies,
strategies, head-to-head picks, agreement, own trades, news; F&O contract prices are labelled examples), then inlines
it into `template.html` with the design system, the page helpers and the platform runtime, and writes `page.html`.
Every other platform mockup reads this data.json for its shell. Deterministic.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from platform_build import run  # noqa: E402
from real_data import shell_payload  # noqa: E402


def summary(shell, data):
    return "; ".join(f"{m}: {len(p['items'])} instruments, {len(p['signals'])} signals, F&O {'present' if p['fno'] else 'absent'}"
                     for m, p in shell["markets"].items())


if __name__ == "__main__":
    run(HERE, summary, compose=shell_payload)
