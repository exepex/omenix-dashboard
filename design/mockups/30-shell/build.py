"""Platform shell mockup (design/PLATFORM_DESIGN.md sections 2, 3, 5 and 6; mockup order item 1).

    python design/mockups/30-shell/build.py [--out DIR]

Inlines this folder's `data.json` (Mock: the shell's own payload, also read by every other platform mockup for the
app bar, rail, watchlists, accounts, search and notifications) into `template.html` with the design system, the
page helpers and the platform runtime (design/mockups/_platform/), and writes `page.html`. Deterministic.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from platform_build import run  # noqa: E402


def summary(shell, data):
    return "; ".join(f"{m}: {len(p['items'])} instruments, {len(p['watchlists'])} watchlists, "
                     f"F&O {'present' if p['fno'] else 'absent'}" for m, p in shell["markets"].items())


if __name__ == "__main__":
    run(HERE, summary)
