"""Weather history mockup (story W3a part 2, exepex/trading docs/stories/W3-fno-screens.md; contract 2.14.0).

    python design/mockups/46-weather-history/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

`data.json` is the catalog's getFnoWeatherHistory examples, read from api/examples/fno-screens.json (one copy of the
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
    return screen_payload("getFnoWeatherHistory", page="weather_history", note="MOCK: the F&O data catalog's example weather history "
                          "(made-up numbers on a future date), in the contract the backend will publish (story W3, contract 2.14.0). "
                          "Research and paper only.")


def summary(shell, data):
    return "; ".join(f"{k}: {s['case']}, {len(s['value']['payload']['sessions'])} sessions" for k, s in data["states"].items())


if __name__ == "__main__":
    run(HERE, summary, compose=compose)
