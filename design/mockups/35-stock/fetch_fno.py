"""Copy the listed monthly futures of the page's Indian stock from NSE's daily F&O file (run by hand, needs the network;
the build never fetches):

    python design/mockups/35-stock/fetch_fno.py 2026-10-12 RELIANCE

Writes source/fno_expiries.csv: per listed stock future (FUTSTK) of the day, the expiry, close, previous close, open
interest and its change, and the lot (UDiFF `BhavCopy_NSE_FO_0_0_0_<YYYYMMDD>_F_0000.csv.zip`). Stock F&O has monthly
expiries only (NSE lists the near, next and far month).
"""
import csv
import io
import os
import sys
import urllib.request
import zipfile

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source", "fno_expiries.csv")
URL = "https://nsearchives.nseindia.com/content/fo/BhavCopy_NSE_FO_0_0_0_{day}_F_0000.csv.zip"
FIELDS = ["date", "underlying", "expiry", "close", "prev_close", "oi", "oi_chg", "lot"]


def futures(day: str, tickers: set) -> list:
    raw = urllib.request.urlopen(urllib.request.Request(URL.format(day=day.replace("-", "")), headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()
    z = zipfile.ZipFile(io.BytesIO(raw))
    rows = csv.DictReader(io.TextIOWrapper(z.open(z.namelist()[0]), "utf-8"))
    return sorted(([r["TradDt"], r["TckrSymb"], r["XpryDt"], r["ClsPric"], r["PrvsClsgPric"], r["OpnIntrst"], r["ChngInOpnIntrst"], r["NewBrdLotQty"]]
                   for r in rows if r["FinInstrmTp"] == "STF" and r["TckrSymb"] in tickers), key=lambda r: (r[1], r[2]))


if __name__ == "__main__":
    day, *tickers = sys.argv[1:]
    rows = futures(day, set(tickers))
    with open(OUT, "w", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(FIELDS)
        out.writerows(rows)
    print(OUT, len(rows), "futures")
