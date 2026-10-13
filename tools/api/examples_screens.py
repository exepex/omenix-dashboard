"""Payloads of the screener (33) and Markets overview (34) blocks, built from those mockups' data.json (real NSE files
and the stock tool's records of 12 Oct 2026, labelled Mock). A value is copied, or computed from the rows the way the
mockup computes it (counts, sorting, a page); where 34 shows the same figure, the builder checks it equals 34's own."""

from __future__ import annotations

from statistics import median

CLOSE_UTC = {"india": "T10:00:00Z", "us": "T20:00:00Z"}  # NSE closes 15:30 IST, NYSE 16:00 ET
ROW_KEYS = ("s", "n", "g", "p", "d1", "w1", "m1", "m3", "y1", "h", "l", "v", "va", "dl", "r", "u")
FNO_KEYS = ("s", "n", "kind", "fut", "fc", "oi", "oc", "b", "iv", "ivl", "ivh", "ivr", "pcr", "mv", "x", "lot")
QUOTE_KEYS = ("d1", "w1", "m1", "m3", "y1", "hi52", "lo52")
INDEX_OPTIONS = ("BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "NIFTY")
PAGE = 25


class Screens:
    def __init__(self, screener: dict, markets: dict):
        self.C, self.K = screener, markets

    def as_of(self, market):
        return self.C["day"] + CLOSE_UTC[market]

    def rows(self, market, uni="all"):
        return [r for r in self.C["markets"][market]["stocks"] if uni == "all" or uni in r["u"]]


def _same(label, ours, theirs):
    if ours != theirs:
        raise ValueError(f"{label}: the screener's rows give {ours}, the Markets mockup shows {theirs}")


def _counts(rows, market):
    up, down = sum(1 for r in rows if (r["d1"] or 0) > 0), sum(1 for r in rows if (r["d1"] or 0) < 0)
    near = lambda r, k, f: r[k] and (r["p"] >= r[k] * f if k == "h" else r["p"] <= r[k] * f)  # noqa: E731
    return {"n": len(rows), "up": up, "down": down, "flat": len(rows) - up - down,
            "high": sum(1 for r in rows if near(r, "h", 1)), "near_high": sum(1 for r in rows if near(r, "h", .98)),
            "low": sum(1 for r in rows if near(r, "l", 1)), "near_low": sum(1 for r in rows if near(r, "l", 1.02)),
            "up_1m": sum(1 for r in rows if (r["m1"] or 0) > 0),
            "screens": {"movers": sum(1 for r in rows if abs(r["d1"] or 0) >= 5),
                        "volume": sum(1 for r in rows if (r["va"] or 0) >= 5e4 and r["v"] >= 3 * r["va"]),
                        "trend": sum(1 for r in rows if (r["m1"] or 0) >= 10), "fall": sum(1 for r in rows if (r["m1"] or 0) <= -10),
                        "delivery": sum(1 for r in rows if (r["dl"] or 0) >= 70 and (r["va"] or 0) >= 1e5) if market == "india" else None,
                        "oversold": sum(1 for r in rows if r["r"] is not None and r["r"] < 30)}}


def screener_summary(x: Screens, market):
    unis = ("all", "n500", "fno", "ours") if market == "india" else ("ours",)
    out = {u: _counts(x.rows(market, u), market) for u in unis}
    for u, theirs in x.K["markets"][market]["breadth"].items():
        _same(f"breadth {market} {u}", {k: v for k, v in out[u].items() if k != "screens"}, theirs)
    return {"": ("counts per universe (the Markets breadth equals them)", {"as_of": x.as_of(market), "universes": out})}


def _page(x, market, rows, total, size=PAGE):
    return {"as_of": x.as_of(market), "currency": "INR" if market == "india" else "USD", "total": total, "page": 1, "page_size": size,
            "rows": [{k: r[k] for k in ROW_KEYS} for r in rows[:size]]}


def screener_stocks(x: Screens, market):
    value = lambda r: r["p"] * r["v"]  # noqa: E731
    if market == "us":
        rows = sorted(x.rows("us"), key=value, reverse=True)
        movers = sorted(x.rows("us"), key=lambda r: -r["d1"])[:5]
        _same("US gainers", [r["s"] for r in movers], [m["s"] for m in x.K["markets"]["us"]["movers"]["ours"]["gainers"]])
        return {"": ("first page, sorted by value traded (the default)", _page(x, "us", rows, len(rows))),
                "_gainers": ("the Markets gainers: sort=d1&page_size=5", _page(x, "us", movers, len(rows), 5))}
    rows = sorted(x.rows("india"), key=value, reverse=True)
    n500 = x.rows("india", "n500")
    gainers = sorted(n500, key=lambda r: -r["d1"])
    _same("Nifty 500 gainers", [r["s"] for r in gainers[:8]], [m["s"] for m in x.K["markets"]["india"]["movers"]["n500"]["gainers"]])
    high = sorted((r for r in rows if r["h"] and r["p"] >= r["h"] * .98), key=lambda r: -(r["p"] - r["l"]) / (r["h"] - r["l"]))
    return {"": ("first page of every NSE stock, sorted by value traded (the default)", _page(x, "india", rows, len(rows))),
            "_high": ("screen=high: near the 52-week high, closest first", _page(x, "india", high, len(high))),
            "_gainers": ("the Markets gainers: u=n500&sort=d1&page_size=8", _page(x, "india", gainers, len(n500), 8))}


def screener_tools(x: Screens, market):
    sig = x.C["markets"][market]["signals"]
    companies = [{"s": s, "strategies": v["strategies"], "prob_up": v["prob_up"], "days_to_results": v["days_to_results"]} for s, v in sorted(sig.items())]
    return {"": ("the 20 followed companies", {"as_of": x.C["day"], "horizon_days": x.C["tools"]["horizon_days"], "companies": companies})}


def fno_screener_summary(x: Screens, market):
    rows = x.C["markets"]["india"]["fno"]
    kinds = ("long_buildup", "short_buildup", "short_covering", "long_unwinding")
    return {"": ("counts over the F&O underlyings", {"as_of": x.as_of("india"), "n": len(rows), "expiry": min(r["x"] for r in rows),
            "buildups": {k: sum(1 for r in rows if r["b"] == k) for k in kinds},
            "screens": {"ivhigh": sum(1 for r in rows if (r["ivr"] or 0) >= 80), "ivlow": sum(1 for r in rows if r["ivr"] is not None and r["ivr"] <= 20),
                        "oiup": sum(1 for r in rows if (r["oc"] or 0) >= 5), "index": sum(1 for r in rows if r["kind"] == "index")}})}


def fno_screener_rows(x: Screens, market):
    rows = sorted(x.C["markets"]["india"]["fno"], key=lambda r: -(r["oi"] * r["fut"]))
    page = lambda rs, total: {"as_of": x.as_of("india"), "currency": "INR", "total": total, "page": 1, "page_size": PAGE,  # noqa: E731
                              "rows": [{k: r[k] for k in FNO_KEYS} for r in rs[:PAGE]]}
    idx = sorted((r for r in rows if r["s"] in INDEX_OPTIONS), key=lambda r: r["s"])
    _same("index options", [{k: r[k] for k in FNO_KEYS} for r in idx], [{k: r[k] for k in FNO_KEYS} for r in x.K["markets"]["india"]["fno"]])
    return {"": ("first page, by futures open interest (the default)", page(rows, len(rows))),
            "_index_options": ("the Markets index options: symbols=NIFTY,BANKNIFTY,FINNIFTY,MIDCPNIFTY", page(idx, len(idx)))}


def _quote(row, kind, as_of):
    q = {"name": row["name"], "kind": kind, "close": row["close"], "as_of": as_of, **{k: row[k] for k in QUOTE_KEYS}, "closes": row["closes"]}
    for k in ("pe", "pb", "dy"):
        if k in row:
            q[k] = row[k]
    if "id" in row:
        q = {"id": row["id"], **q}
    if row.get("sectors"):
        q["sectors"] = row["sectors"]
    return q


def overview_indices(x: Screens, market):
    mk = x.K["markets"][market]
    if market == "india":
        rows = [_quote(r, r["group"], x.K["day"]) for r in mk["indices"]["rows"] if r["group"] != "sector"]
        vix = next(r for r in rows if r["kind"] == "vol")
        summary = f"broad indices and India VIX (VIX 3-month middle, the median of its last 63 closes: {median(vix['closes'][-63:])})"
    else:
        rows, summary = [_quote(r, r["role"], r["as_of"]) for r in mk["indices"]["rows"]], "the S&P 500 fund and the VIX"
    return {"": (summary, {"indices": rows})}


def india_sectors(x: Screens, market):
    mk = x.K["markets"]["india"]
    return {"": ("sector indices and Nifty 500 industries", {"indices": [_quote(r, "sector", x.K["day"]) for r in mk["indices"]["rows"] if r["group"] == "sector"],
                                                            "industries": mk["sectors"]})}


def us_sectors(x: Screens, market):
    return {"": ("US sector funds", {"funds": [_quote(r, r["role"], r["as_of"]) for r in x.K["markets"]["us"]["sectors"]]})}


def flows(x: Screens, market):
    f = x.K["markets"]["india"]["flows"]
    return {"": ("FII/DII per day and NSDL FPI", {"currency": "INR", "days": f["days"], "nsdl": f["nsdl"]})}


def rates(x: Screens, market):
    return {"": ("Treasury par yields", {"yields": x.K["markets"]["us"]["yields"]})}


def world(x: Screens, market):
    return {"": ("world cues, currencies, commodities", {"quotes": [_quote(r, r["role"], r["as_of"]) for r in x.K["markets"][market]["world"]]})}


def events(x: Screens, market):
    mk = x.K["markets"][market]
    major = set(mk["regime"]["major_event_names"])
    return {"_markets": ("the Markets overview's calendar (major: named by the stock tool's regime record)", {"events": [
        {"date": e["date"], "title": e["name"], "kind": e["type"], "major": e["name"] in major, "inst": e["ticker"]} for e in mk["events"]]})}
