"""The screener route's filters, sorts and pages (api/paths/blocks-screener.yaml): the reference the dashboard's route
must match, ported from the signed-off 33-screener template (SPRESETS, FPRESETS, keep, sortRows). The examples are
built with it, and check_stored recomputes every paged example from its stored table and its x-query. Pure."""

from __future__ import annotations


def pos52(r):
    """Where the close sits in the 52-week range, 0 to 1. Unrounded: the template rounds it to a whole percent for
    display, which would order the many 100 % ties by table order instead of by closeness to the high."""
    return (r["p"] - r["l"]) / (r["h"] - r["l"]) if r["h"] and r["l"] is not None and r["h"] > r["l"] else None


def vr(r):
    return r["v"] / r["va"] if r["va"] else None


STOCK_SCREENS = {  # 33 notes row 4 (the template's SPRESETS); picks and results come as symbols from the tools block
    "high": lambda r: bool(r["h"]) and r["p"] >= r["h"] * .98,
    "low": lambda r: bool(r["l"]) and r["p"] <= r["l"] * 1.02,
    "movers": lambda r: abs(r["d1"] or 0) >= 5,
    "volume": lambda r: (r["va"] or 0) >= 5e4 and r["v"] >= 3 * r["va"],
    "trend": lambda r: (r["m1"] or 0) >= 10,
    "fall": lambda r: (r["m1"] or 0) <= -10,
    "delivery": lambda r: (r.get("dl") or 0) >= 70 and (r["va"] or 0) >= 1e5,
    "oversold": lambda r: r["r"] is not None and r["r"] < 30,
}
FNO_SCREENS = {  # 33 notes row 10 (FPRESETS)
    **{b: (lambda b: lambda r: r["b"] == b)(b) for b in ("long_buildup", "short_buildup", "short_covering", "long_unwinding")},
    "ivhigh": lambda r: (r["ivr"] or 0) >= 80,
    "ivlow": lambda r: r["ivr"] is not None and r["ivr"] <= 20,
    "oiup": lambda r: (r["oc"] or 0) >= 5,
    "index": lambda r: r["kind"] == "index",
}


def _stock_value(q: dict):
    period = q.get("period", "m1")
    keys = {"value": lambda r: r["p"] * r["v"], "pos": pos52, "abs": lambda r: abs(r["d1"] or 0), "vr": vr, "chg": lambda r: r[period]}
    return lambda r, k: keys[k](r) if k in keys else r.get(k)


def _fno_value(r, k):
    return r["oi"] * r["fut"] if k == "oi" else r.get(k)


def _keep(q: dict):
    period, screen = q.get("period", "m1"), STOCK_SCREENS.get(q.get("screen"))
    tests = [
        lambda r: q["u"] == "all" or q["u"] in r["u"],
        lambda r: screen is None or screen(r),
        lambda r: "symbols" not in q or r["s"] in q["symbols"],
        lambda r: "pmin" not in q or r["p"] >= q["pmin"],
        lambda r: "pmax" not in q or r["p"] <= q["pmax"],
        lambda r: "cmin" not in q or (r[period] if r[period] is not None else -1e9) >= q["cmin"],
        lambda r: "vrmin" not in q or (vr(r) or 0) >= q["vrmin"],
        lambda r: "dlmin" not in q or (r.get("dl") or 0) >= q["dlmin"],
        lambda r: "rmax" not in q or (r["r"] if r["r"] is not None else 1e9) <= q["rmax"],
        lambda r: "vamin" not in q or (r["va"] or 0) >= q["vamin"],
    ]
    return lambda r: all(t(r) for t in tests)


def _sorted(rows: list, key: str, value, tie) -> list:
    """Descending, or ascending with a leading minus; a missing value always last. Ties go by `tie` (value traded, or
    futures open interest, descending), then by symbol: the stored table's row order is not part of the contract, so
    the route never depends on it."""
    neg, k = key.startswith("-"), key.lstrip("-")

    def order(r):
        v = value(r, k)
        return (v is None, 0 if v is None else (v if neg else -v), -tie(r), r["s"])
    return sorted(rows, key=order)


def _page(table: dict, rows: list, q: dict) -> dict:
    start = (q["page"] - 1) * q["page_size"]
    return {"as_of": table["as_of"], "currency": table["currency"], "total": len(rows), "page": q["page"],
            "page_size": q["page_size"], "rows": rows[start:start + q["page_size"]]}


def stocks_page(table: dict, q: dict) -> dict:
    """The served ScreenerStocks page of a stored table for a query (the route's u, screen, period, filters, symbols,
    sort, page)."""
    rows = [r for r in table["rows"] if _keep(q)(r)]
    return _page(table, _sorted(rows, q["sort"], _stock_value(q), lambda r: r["p"] * r["v"]), q)


def fno_page(table: dict, q: dict) -> dict:
    """The served FnoScreenerRows page of the stored F&O table for a query (screen, symbols, sort, page)."""
    screen = FNO_SCREENS.get(q.get("screen"))
    rows = [r for r in table["rows"] if (screen is None or screen(r)) and ("symbols" not in q or r["s"] in q["symbols"])]
    return _page(table, _sorted(rows, q["sort"], _fno_value, lambda r: r["oi"] * r["fut"]), q)
