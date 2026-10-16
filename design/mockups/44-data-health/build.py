"""F&O data-health mockup (story W3, exepex/trading docs/stories/W3-fno-screens.md).

    python design/mockups/44-data-health/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

`data.json` is the catalog's getFnoDataHealth examples, read from api/examples/fno-screens.json (one copy of the
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
    return screen_payload("getFnoDataHealth", page="data-health", note="MOCK: the F&O data catalog's example data-health page "
                          "(made-up numbers on a future date), in the contract the backend will publish (story W3, contract 2.11.0). "
                          "Research and paper only.")


def summary(shell, data):
    return "; ".join(f"{k}: {s['case']}, publish {s['value']['payload']['publish']['status']}" for k, s in data["states"].items())


if __name__ == "__main__":
    run(HERE, summary, compose=compose)
