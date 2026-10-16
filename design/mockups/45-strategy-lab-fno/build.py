"""Strategy lab, F&O tab mockup (story W3d, exepex/trading docs/stories/W3-fno-screens.md;
the F&O tab of the Strategy lab on the catalog; it supersedes 38's F&O part).

    python design/mockups/45-strategy-lab-fno/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

`data.json` is the catalog's getFnoStrategyLab examples, read from api/examples/fno-screens.json (one copy of the
data). Inlines it with 30-shell/data.json and the page's own js/*.js into `template.html`; writes `page.html`.
Deterministic.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from catalog_data import screen_payload  # noqa: E402
from platform_build import run  # noqa: E402


def compose() -> dict:
    return screen_payload("getFnoStrategyLab", page="strategy-lab-fno", note="MOCK: the F&O data catalog's example Strategy lab (F&O) "
                          "(made-up numbers on a future date), in the contract the backend will publish (story W3, contract 2.12.0). "
                          "Research and paper only.")


def summary(shell, data):
    return "; ".join(f"{k}: {s['case']}, {'passed' if s['value']['payload']['headline']['any_passed'] else 'none passed'}" for k, s in data["states"].items())


if __name__ == "__main__":
    run(HERE, summary, compose=compose)
