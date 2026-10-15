"""Market weather mockup (exepex/trading design v2 section 2.3; story P1, the F&O data catalog).

    python design/mockups/40-weather/build.py [--out DIR]     (build 30-shell first: it writes the shell's data)

`data.json` is the catalog's getFnoWeather examples, read from api/examples/fno-screens.json (one copy of the data;
the check in tools/api/check_fno_screens.py fails if they differ). Inlines it with 30-shell/data.json and the page's
own js/*.js into `template.html`; writes `page.html`. Deterministic.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "_platform"))
from catalog_data import screen_payload  # noqa: E402
from platform_build import run  # noqa: E402


def compose() -> dict:
    return screen_payload("getFnoWeather", page="weather", note="MOCK: the F&O data catalog's example weather (made-up numbers on a future "
                          "date), in the contract the backend will publish (story P1). No weather record exists yet. Research and paper only.")


def summary(shell, data):
    return "; ".join(f"{k}: {s['case']}, {s['value']['payload']['colour']}" for k, s in data["states"].items())


if __name__ == "__main__":
    run(HERE, summary, compose=compose)
