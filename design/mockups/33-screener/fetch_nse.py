"""Fetch the real NSE files this mockup reads (run by hand, needs the network; the build itself never fetches).

    python design/mockups/33-screener/fetch_nse.py 2026-10-12 [reference] [equity] [fno]     (no step named: all three)

Writes into source/:
- equity.csv: one row per EQ/BE stock that traded on the last day, reduced from a year of NSE's daily equity file
  (UDiFF `BhavCopy_NSE_CM_*`; a renamed stock's history joined under its new symbol, from NSE's `symbolchange.csv`,
  the joins used in renames.csv; prices and volumes adjusted for splits and bonus issues, the actions used in actions.csv): closes 1 week, 1 month, 3 months and 1 year back, 52-week high and low, volume and
  its 20-day average, RSI 14, the last 21 closes;
- delivery.csv: the last day's delivery % per stock (`sec_bhavdata_full_<DDMMYYYY>.csv`);
- names.csv: company names (`EQUITY_L.csv`) and Nifty 500 industries (`ind_nifty500list.csv`);
- fno.csv.gz: per F&O underlying and day, three months back (UDiFF `BhavCopy_NSE_FO_*`): the underlying's close,
  the nearest monthly future (close, previous close, OI, OI change), all futures' OI, all calls' and puts' OI of that
  expiry, the at-the-money call and put (strike nearest the underlying: close, volume), the lot and the expiry.
Days are NSE's sessions (_platform/nse_calendar.py); a session without a file is skipped and printed.
"""
import csv
import datetime as dt
import gzip
import io
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from collections import defaultdict
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "_platform"))
from nse_calendar import sessions  # noqa: E402  (NSE's sessions, never weekdays: the 1 Feb 2026 Sunday Budget session)
import nse_actions  # noqa: E402  (splits and bonus issues: NSE's files never adjust past prices)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source")
BASE = "https://nsearchives.nseindia.com"


def get(path: str) -> bytes:
    """One NSE file; a holiday's 404 is final, a dropped connection is tried twice more."""
    for attempt in range(3):
        try:
            url = path if path.startswith("http") else BASE + path
            return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()
        except urllib.error.HTTPError:
            raise
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def unzip_csv(raw: bytes) -> list:
    z = zipfile.ZipFile(io.BytesIO(raw))
    return list(csv.DictReader(io.TextIOWrapper(z.open(z.namelist()[0]), "utf-8")))


def days(last: dt.date, n: int):
    return sessions(last - dt.timedelta(days=n), last)


def rsi14(closes: list) -> float | None:
    """Wilder's 14-day RSI over the closes given (all of the year, so the smoothing has settled)."""
    if len(closes) < 15:
        return None
    gains = [max(0.0, b - a) for a, b in zip(closes, closes[1:])]
    losses = [max(0.0, a - b) for a, b in zip(closes, closes[1:])]
    up, down = sum(gains[:14]) / 14, sum(losses[:14]) / 14
    for g, l in zip(gains[14:], losses[14:]):
        up, down = (up * 13 + g) / 14, (down * 13 + l) / 14
    return round(100.0 if down == 0 else 100 - 100 / (1 + up / down), 1)


def equity(last: dt.date) -> None:
    """One row per stock (the file of a whole year is 12 MB): closes 1 day, 1 week, 1 month, 3 months and 1 year back
    (5, 21, 63 and 250 sessions), 52-week high and low, volume against its 20-day average, RSI 14, the last 21 closes."""
    series = defaultdict(list)
    for d in days(last, 372):
        try:
            rows = unzip_csv(get(f"/content/cm/BhavCopy_NSE_CM_0_0_0_{d:%Y%m%d}_F_0000.csv.zip"))
        except Exception as error:
            print(d, "equity skipped:", error)
            continue
        for r in rows:
            if r["SctySrs"] in ("EQ", "BE"):
                series[r["TckrSymb"]].append((r["TradDt"], r["SctySrs"], float(r["ClsPric"]), float(r["HghPric"]), float(r["LwPric"]), int(float(r["TtlTradgVol"])), float(r["OpnPric"])))
    series, renamed = joined(series, last)
    series = adjusted(series, last, renamed)
    back = lambda s, n: s[-1 - n][2] if len(s) > n else ""
    with open(os.path.join(OUT, "equity.csv"), "w", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(["symbol", "series", "date", "close", "prev", "close_1w", "close_1m", "close_3m", "close_1y", "high_52w", "low_52w",
                      "volume", "volume_avg20", "rsi14", "sessions", "spark_1m"])
        for sym, s in sorted(series.items()):
            if s[-1][0] != last.isoformat():
                continue                           # not traded on the last day
            vols = [x[5] for x in s[-21:-1]]
            out.writerow([sym, s[-1][1], s[-1][0], s[-1][2], back(s, 1), back(s, 5), back(s, 21), back(s, 63), back(s, 250),
                          max(x[3] for x in s[-250:]), min(x[4] for x in s[-250:]), s[-1][5], round(sum(vols) / len(vols)) if vols else "",
                          rsi14([x[2] for x in s]), len(s), ";".join("%g" % x[2] for x in s[-21:])])


def joined(series: dict, last: dt.date) -> tuple:
    """A stock renamed within the year (NSE's symbolchange.csv, e.g. HEG to HEGAM on 22 Sep 2026) keeps one history under
    its new symbol: the old symbol's sessions before the change, then the new one's. Returns the series and {old: new}."""
    first, renamed = (last - dt.timedelta(days=372)).isoformat(), {}
    rows = csv.DictReader(io.StringIO(get("/content/equities/symbolchange.csv").decode("utf-8", "replace")))
    changes = sorted((dt.datetime.strptime(r["EFFECTIVE DATE"].strip(), "%d-%b-%Y").date().isoformat(), r["OLD SYMBOL"].strip(), r["NEW SYMBOL"].strip())
                     for r in rows if r.get("EFFECTIVE DATE", "").strip())
    with open(os.path.join(OUT, "renames.csv"), "w", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(["old_symbol", "new_symbol", "effective_date", "old_sessions_joined"])
        for day, old, new in changes:
            if not first <= day <= last.isoformat() or old not in series:
                continue
            before = [x for x in series.pop(old) if x[0] < day]
            series[new] = before + [x for x in series.get(new, []) if x[0] >= day]
            renamed = {o: (new if n == old else n) for o, n in renamed.items()} | {old: new}
            out.writerow([old, new, day, len(before)])
    return series, renamed


def adjusted(series: dict, last: dt.date, renamed: dict) -> dict:
    """Prices adjusted for the year's splits, bonus issues and demergers (NSE's corporate actions; the bulk list, then one lookup
    per symbol with an unexplained jump); the actions used are written to actions.csv."""
    span = f"&from_date={last - dt.timedelta(days=372):%d-%m-%Y}&to_date={last:%d-%m-%Y}"
    acts = [[renamed.get(a[0], a[0]), *a[1:]] for a in nse_actions.actions(json.loads(get(nse_actions.API + span)))]
    for sym in nse_actions.unexplained(series, acts):
        # no date span here: with one, NSE answers [] for some symbols (BANKNIFTY1); the window is applied below
        acts += nse_actions.actions(json.loads(get(nse_actions.API + "&symbol=" + urllib.parse.quote(sym))))
    first = (last - dt.timedelta(days=372)).isoformat()
    acts = [(renamed.get(a[0], a[0]), *a[1:]) for a in acts]   # an action listed under the old symbol follows the rename
    acts = nse_actions.demerger_factors(sorted({tuple(a) for a in acts if first <= a[1] <= last.isoformat()}), series)
    with open(os.path.join(OUT, "actions.csv"), "w", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(["symbol", "ex_date", "factor", "subject"])
        out.writerows(acts)
    by = defaultdict(list)
    for a in acts:
        by[a[0]].append(a)
    return {sym: nse_actions.adjust(rows, by[sym]) if sym in by else rows for sym, rows in series.items()}


def fno(last: dt.date) -> None:
    with gzip.open(os.path.join(OUT, "fno.csv.gz"), "wt", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(["date", "underlying", "kind", "spot", "expiry", "fut_close", "fut_prev", "fut_oi", "fut_oi_chg", "fut_oi_all",
                      "ce_oi", "pe_oi", "atm", "atm_ce", "atm_ce_vol", "atm_pe", "atm_pe_vol", "lot"])
        for d in days(last, 95):
            try:
                rows = unzip_csv(get(f"/content/fo/BhavCopy_NSE_FO_0_0_0_{d:%Y%m%d}_F_0000.csv.zip"))
            except Exception as error:
                print(d, "fno skipped:", error)
                continue
            by = defaultdict(list)
            for r in rows:
                by[r["TckrSymb"]].append(r)
            for sym, rs in sorted(by.items()):
                expiries = sorted({r["XpryDt"] for r in rs if r["XpryDt"] > d.isoformat()})
                monthly = [e for e in expiries if e == max(x for x in expiries if x[:7] == e[:7])]
                if not monthly:
                    continue
                e = monthly[0]
                fut = next((r for r in rs if r["FinInstrmTp"] in ("STF", "IDF") and r["XpryDt"] == e), None)
                opts = [r for r in rs if r["FinInstrmTp"] in ("STO", "IDO") and r["XpryDt"] == e]
                if not fut or not opts:
                    continue
                spot = float(fut["UndrlygPric"])
                atm = min({float(r["StrkPric"]) for r in opts}, key=lambda k: (abs(k - spot), k))
                leg = lambda t: next((r for r in opts if float(r["StrkPric"]) == atm and r["OptnTp"] == t), {})
                ce, pe = leg("CE"), leg("PE")
                out.writerow([d.isoformat(), sym, "index" if fut["FinInstrmTp"] == "IDF" else "stock", spot, e, fut["ClsPric"], fut["PrvsClsgPric"],
                              fut["OpnIntrst"], fut["ChngInOpnIntrst"], sum(int(float(r["OpnIntrst"])) for r in rs if r["FinInstrmTp"] in ("STF", "IDF")),
                              sum(int(float(r["OpnIntrst"])) for r in opts if r["OptnTp"] == "CE"), sum(int(float(r["OpnIntrst"])) for r in opts if r["OptnTp"] == "PE"),
                              "%g" % atm, ce.get("ClsPric", ""), ce.get("TtlTradgVol", ""), pe.get("ClsPric", ""), pe.get("TtlTradgVol", ""), fut["NewBrdLotQty"]])


def reference(last: dt.date) -> None:
    dl = get(f"/products/content/sec_bhavdata_full_{last:%d%m%Y}.csv").decode()
    with open(os.path.join(OUT, "delivery.csv"), "w", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(["symbol", "series", "delivery_pct"])
        for r in csv.DictReader(io.StringIO(dl.replace(", ", ","))):
            if r["SERIES"] in ("EQ", "BE"):
                out.writerow([r["SYMBOL"], r["SERIES"], r["DELIV_PER"].strip()])
    names = {r["SYMBOL"]: r["NAME OF COMPANY"] for r in csv.DictReader(io.StringIO(get("/content/equities/EQUITY_L.csv").decode()))}
    industry = {r["Symbol"]: r["Industry"] for r in csv.DictReader(io.StringIO(get("/content/indices/ind_nifty500list.csv").decode()))}
    with open(os.path.join(OUT, "names.csv"), "w", newline="") as handle:
        out = csv.writer(handle)
        out.writerow(["symbol", "name", "nifty500_industry"])
        out.writerows([s, n, industry.get(s, "")] for s, n in sorted(names.items()))


if __name__ == "__main__":
    last = dt.date.fromisoformat(sys.argv[1])
    os.makedirs(OUT, exist_ok=True)
    for step in (reference, equity, fno):
        if len(sys.argv) < 3 or step.__name__ in sys.argv[2:]:
            step(last)
