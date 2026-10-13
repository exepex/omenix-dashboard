"""The paged blocks' examples (33-screener, 34-markets): every page is the route's answer (screener_route.py) to the
query a signed-off state asks, over the table its publisher stores (examples_screens.stored_tables). Each example
carries that query (x-query); check_stored recomputes the page from it. Where 34 shows the same rows, the builder
checks they are 34's own."""

from __future__ import annotations

import screener_route as route
from examples_screens import Screens, _same, stored_tables

PAGE = {"page": 1, "page_size": 25}
INDEX_OPTIONS = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"]  # the dashboard's list, in its order (34 decision 5)


def _tools(x: Screens, test) -> list:
    """A tools-based screen's symbols, as the dashboard asks them: the followed companies the test keeps, in the tools
    block's order (by symbol)."""
    return [s for s, v in sorted(x.C["markets"]["india"]["signals"].items()) if test(v)]


def _stock_queries(x: Screens, market: str) -> dict:
    if market == "us":
        return {"": ("first page, sorted by value traded (the default)", {"u": "ours", "sort": "value", **PAGE}),
                "_gainers": ("the Markets gainers", {"u": "ours", "sort": "d1", "page": 1, "page_size": 5})}
    liquid = {"u": "all", "vamin": 100000, "pmin": 20}
    return {
        "": ("first page of every NSE stock, sorted by value traded (the default)", {"u": "all", "sort": "value", **PAGE}),
        "_high": ("screen=high: near the 52-week high, closest first", {"u": "all", "screen": "high", "sort": "pos", **PAGE}),
        "_gainers": ("the Markets gainers (Nifty 500)", {"u": "n500", "sort": "d1", "page": 1, "page_size": 8}),
        "_ours": ("the 20 companies the stock tool follows (33 states ours and buy)", {"u": "ours", "sort": "value", **PAGE}),
        "_year": ("the Nifty 500 by change over one year, biggest first (33 state year)", {"u": "n500", "period": "y1", "sort": "chg", **PAGE}),
        "_volume": ("screen=volume: 3× usual volume, highest ratio first (33 state volume)", {"u": "all", "screen": "volume", "sort": "vr", **PAGE}),
        "_oversold": ("screen=oversold within the Nifty 500, lowest RSI first (33 state oversold)", {"u": "n500", "screen": "oversold", "sort": "-r", **PAGE}),
        "_picks": ("our strategies 3+ buy: the tools block's symbols (33 state picks)", {"u": "all", "symbols": _tools(x, lambda v: v["strategies"]["buy"] >= 3), "sort": "value", **PAGE}),
        "_results": ("results within 7 days: the tools block's symbols (33 state results)", {"u": "all", "symbols": _tools(x, lambda v: v["days_to_results"] is not None and v["days_to_results"] <= 7), "sort": "value", **PAGE}),
        "_filters": ("your filters: price from 100, up 5%+ in a month, delivery 60%+ (33 state filters)", {"u": "all", "period": "m1", "pmin": 100, "cmin": 5, "dlmin": 60, "sort": "value", **PAGE}),
        "_losers": ("the Markets losers, all NSE liquid stocks (34 state losers)", {**liquid, "sort": "-d1", "page": 1, "page_size": 8}),
        "_active": ("the Markets most traded, Nifty 500 (34 state active)", {"u": "n500", "sort": "value", "page": 1, "page_size": 8}),
    }


MOVERS = {("india", "_gainers"): ("n500", "gainers"), ("india", "_losers"): ("all", "losers"),  # 34's own lists
          ("india", "_active"): ("n500", "active"), ("us", "_gainers"): ("ours", "gainers")}


def screener_stocks(x: Screens, market):
    table = stored_tables(x)["ScreenerStocksTableIndia" if market == "india" else "ScreenerStocksTableUs"]
    out = {}
    for suffix, (summary, query) in _stock_queries(x, market).items():
        page = route.stocks_page(table, query)
        if (market, suffix) in MOVERS:
            uni, kind = MOVERS[(market, suffix)]
            _same(f"{market} {uni} {kind}", [r["s"] for r in page["rows"]], [m["s"] for m in x.K["markets"][market]["movers"][uni][kind]])
        out[suffix] = (summary, page, query)
    return out


FNO_QUERIES = {
    "": ("first page, by futures open interest (the default)", {"sort": "oi", **PAGE}),
    "_index_options": ("the Markets index options, by futures open interest", {"symbols": INDEX_OPTIONS, "sort": "oi", **PAGE}),
    "_short": ("short build-up, by open interest change (33 state fno-short)", {"screen": "short_buildup", "sort": "oc", **PAGE}),
    "_ivhigh": ("IV near its 3-month high, highest first (33 state fno-ivhigh)", {"screen": "ivhigh", "sort": "ivr", **PAGE}),
    "_index": ("the index underlyings, by futures open interest (33 state fno-index)", {"screen": "index", "sort": "oi", **PAGE}),
}


def fno_screener_rows(x: Screens, market):
    table = stored_tables(x)["FnoScreenerTable"]
    out = {suffix: (summary, route.fno_page(table, query), query) for suffix, (summary, query) in FNO_QUERIES.items()}
    shown = sorted(out["_index_options"][1]["rows"], key=lambda r: r["s"])  # 34 lists the same four rows by name
    theirs = [{k: r[k] for k in shown[0]} for r in sorted(x.K["markets"]["india"]["fno"], key=lambda r: r["s"])]
    _same("index options", shown, theirs)
    return out
