"""Copy the listed monthly futures of the page's Indian stock from NSE's daily F&O file (run by hand, needs the network;
the build never fetches):

    python design/mockups/35-stock/fetch_fno.py 2026-10-12 RELIANCE

Writes, from NSE's daily F&O file (UDiFF `BhavCopy_NSE_FO_0_0_0_<YYYYMMDD>_F_0000.csv.zip`):
- source/fno_expiries.csv: per listed stock future (STF) of the day, the expiry, close, previous close, open interest
  and its change, and the lot. Stock F&O has monthly expiries only (NSE lists the near, next and far month);
- source/fno_options.csv: per stock option (STO) of those expiries with a strike within 10% of the underlying: the
  strike, call or put, close, previous close, open interest, its change, contracts traded and the underlying's price.
"""
import csv
import io
import os
import sys
import urllib.request
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "source", "fno_expiries.csv")
OUT_OPT = os.path.join(HERE, "source", "fno_options.csv")
URL = "https://nsearchives.nseindia.com/content/fo/BhavCopy_NSE_FO_0_0_0_{day}_F_0000.csv.zip"
FIELDS = ["date", "underlying", "expiry", "close", "prev_close", "oi", "oi_chg", "lot"]
OPT_FIELDS = ["date", "underlying", "expiry", "strike", "type", "close", "prev_close", "oi", "oi_chg", "contracts", "spot"]


def day_rows(day: str) -> list:
    raw = urllib.request.urlopen(urllib.request.Request(URL.format(day=day.replace("-", "")), headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()
    z = zipfile.ZipFile(io.BytesIO(raw))
    return list(csv.DictReader(io.TextIOWrapper(z.open(z.namelist()[0]), "utf-8")))


def futures(rows: list, tickers: set) -> list:
    return sorted(([r["TradDt"], r["TckrSymb"], r["XpryDt"], r["ClsPric"], r["PrvsClsgPric"], r["OpnIntrst"], r["ChngInOpnIntrst"], r["NewBrdLotQty"]]
                   for r in rows if r["FinInstrmTp"] == "STF" and r["TckrSymb"] in tickers), key=lambda r: (r[1], r[2]))


def options(rows: list, tickers: set) -> list:
    near = lambda r: abs(float(r["StrkPric"]) / float(r["UndrlygPric"]) - 1) <= 0.10
    return sorted(([r["TradDt"], r["TckrSymb"], r["XpryDt"], r["StrkPric"], r["OptnTp"], r["ClsPric"], r["PrvsClsgPric"], r["OpnIntrst"], r["ChngInOpnIntrst"],
                    r["TtlTradgVol"], r["UndrlygPric"]] for r in rows if r["FinInstrmTp"] == "STO" and r["TckrSymb"] in tickers and near(r)),
                  key=lambda r: (r[1], r[2], float(r[3]), r[4]))


def write(path: str, fields: list, rows: list) -> None:
    with open(path, "w", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(fields)
        out.writerows(rows)
    print(path, len(rows), "rows")


if __name__ == "__main__":
    day, *tickers = sys.argv[1:]
    rows = day_rows(day)
    write(OUT, FIELDS, futures(rows, set(tickers)))
    write(OUT_OPT, OPT_FIELDS, options(rows, set(tickers)))
