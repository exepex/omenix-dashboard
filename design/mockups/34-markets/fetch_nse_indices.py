"""Fetch NSE's daily index file for a year (run by hand, needs the network; the build itself never fetches).

    python design/mockups/34-markets/fetch_nse_indices.py 2026-10-12

Writes source/indices.csv: per day and index (the broad, sector and volatility indices below), the close, the %
change and, where NSE gives them, P/E, P/B and dividend yield (`ind_close_all_<DDMMYYYY>.csv`). Days are NSE's sessions
(_platform/nse_calendar.py); a session without a file is skipped and printed.
"""
import csv
import datetime as dt
import io
import os
import sys
import time
import urllib.error
import urllib.request
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "_platform"))
from nse_calendar import sessions  # noqa: E402  (NSE's sessions, never weekdays: the 1 Feb 2026 Sunday Budget session)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source", "indices.csv")
KEEP = ["Nifty 50", "Nifty Next 50", "Nifty 500", "NIFTY Midcap 100", "NIFTY Smallcap 100", "India VIX",
        "Nifty Bank", "Nifty Private Bank", "Nifty PSU Bank", "Nifty Financial Services", "Nifty IT", "Nifty Auto", "Nifty Pharma",
        "Nifty Healthcare Index", "Nifty FMCG", "Nifty Metal", "Nifty Realty", "Nifty Energy", "Nifty Oil & Gas", "Nifty Media",
        "Nifty Infrastructure", "Nifty Consumer Durables", "Nifty Capital Goods", "Nifty Telecommunications"]


def get(url: str) -> bytes:
    for attempt in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()
        except urllib.error.HTTPError:
            raise
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def main(last: dt.date) -> None:
    rows = []
    for d in sessions(last - dt.timedelta(days=372), last):
        try:
            text = get(f"https://nsearchives.nseindia.com/content/indices/ind_close_all_{d:%d%m%Y}.csv").decode()
            rows += [[d.isoformat(), r["Index Name"], r["Closing Index Value"], r["Change(%)"], r["P/E"], r["P/B"], r["Div Yield"]]
                     for r in csv.DictReader(io.StringIO(text)) if r["Index Name"] in KEEP]
        except Exception as error:
            print(d, "skipped:", error)
    with open(OUT, "w", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(["date", "index", "close", "chg_pct", "pe", "pb", "div_yield"])
        out.writerows(sorted(rows))
    print(len(rows), "rows")


if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    main(dt.date.fromisoformat(sys.argv[1]))
