"""Fetch the real NSE files this mockup reads (run by hand, needs the network; the build itself never fetches).

    python design/mockups/32-option-chain/fetch_nse.py 2026-06-01 2026-10-12

Writes source/nifty_fo.csv.gz (NIFTY futures and options from NSE's daily F&O file, UDiFF format: contracts expiring
from the day after the last date up to 31 Dec of that year, strikes within 10% of the last close) and source/index.csv
(NIFTY 50 and India VIX from NSE's daily index file). A day without a file (a holiday) is skipped and printed.
"""
import csv
import datetime as dt
import gzip
import io
import os
import sys
import urllib.request
import zipfile

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source")
FO = "https://nsearchives.nseindia.com/content/fo/BhavCopy_NSE_FO_0_0_0_{:%Y%m%d}_F_0000.csv.zip"
IX = "https://nsearchives.nseindia.com/content/indices/ind_close_all_{:%d%m%Y}.csv"
COLS = {"date": "TradDt", "expiry": "XpryDt", "strike": "StrkPric", "type": "OptnTp", "close": "ClsPric", "prev_close": "PrvsClsgPric",
        "settle": "SttlmPric", "oi": "OpnIntrst", "oi_chg": "ChngInOpnIntrst", "volume": "TtlTradgVol", "underlying": "UndrlygPric", "lot": "NewBrdLotQty"}


def get(url: str) -> bytes:
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()


def main(first: str, last: str) -> None:
    fo, ix, day = [], [], dt.date.fromisoformat(first)
    while day <= dt.date.fromisoformat(last):
        if day.weekday() < 5:
            try:
                z = zipfile.ZipFile(io.BytesIO(get(FO.format(day))))
                fo += [r for r in csv.DictReader(io.TextIOWrapper(z.open(z.namelist()[0]), "utf-8")) if r["TckrSymb"] == "NIFTY"]
                ix += [[day.isoformat(), r[0], r[2], r[3], r[4], r[5], r[7]] for r in csv.reader(io.StringIO(get(IX.format(day)).decode())) if r and r[0] in ("Nifty 50", "India VIX")]
            except Exception as error:   # holidays have no file
                print(day, "skipped:", error)
        day += dt.timedelta(days=1)
    spot = float(next(r["UndrlygPric"] for r in fo if r["TradDt"] == last))
    keep = [r for r in fo if last < r["XpryDt"] <= f"{last[:4]}-12-31" and (not r["OptnTp"] or abs(float(r["StrkPric"]) / spot - 1) <= 0.10)]
    os.makedirs(OUT, exist_ok=True)
    with gzip.open(os.path.join(OUT, "nifty_fo.csv.gz"), "wt", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(COLS)
        for r in keep:
            out.writerow([("%g" % float(r[v]) if r[v] else "") if k == "strike" else (r[v] or "FUT") if k == "type" else r[v] for k, v in COLS.items()])
    with open(os.path.join(OUT, "index.csv"), "w", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(["date", "index", "open", "high", "low", "close", "chg_pct"])
        out.writerows(sorted(ix))
    print(len(keep), "contract rows,", len(ix), "index rows")


if __name__ == "__main__":
    main(*sys.argv[1:3])
