"""Payloads of the option chain's blocks (32), built from that mockup's data.json (real NSE files of 12 Oct 2026,
labelled Mock). A value is copied, or computed from the series the way the page computes it (a period's change, the
VIX's 3-month middle, a period's coverage); check_semantics recomputes the computed ones."""

from __future__ import annotations

from statistics import median

SPANS = {"d5": 5, "m1": 21, "m3": 63}  # the chart periods of 32's template (SPANS), in sessions
SIDE_KEYS = ("code", "close", "chg", "chg_pct", "oi", "oi_chg", "volume", "iv", "greeks", "breakeven", "chance")


def covered(series: list, span: int, value) -> dict:
    """A history-dependent figure: a number only when the series has the period's sessions (span + 1 closes for a
    change, span closes for a middle)."""
    need = span + 1 if value == "change" else span
    days = min(len(series) - (1 if value == "change" else 0), span)
    complete = len(series) >= need
    if not complete:
        number = None
    elif value == "change":
        number = round((series[-1] / series[-1 - span] - 1) * 100, 2)
    else:
        number = round(median(series[-span:]), 2)
    return {"days_in_period": span, "days": max(days, 0), "complete": complete, "value": number}


def history_coverage(nifty: list, vix: list) -> dict:
    return {"nifty": {k: covered(nifty, n, "change") for k, n in SPANS.items()}, "vix_middle_3m": covered(vix, 63, "middle")}


def contract_periods(sessions: int) -> dict:
    out = {k: {"days_in_period": n, "days": min(sessions, n), "complete": sessions >= n} for k, n in SPANS.items()}
    return {**out, "life": {"days_in_period": None, "days": sessions, "complete": True}}


class Chain:
    def __init__(self, data: dict):
        self.C = data["chain"]

    def expiry(self, date):
        return next(x for x in self.C["expiries"] if x["expiry"] == date)

    def default_expiry(self):
        return next(x for x in self.C["expiries"] if x["monthly"])["expiry"]  # the page opens on the nearest monthly


def underlying(x: Chain, market):
    u = x.C["underlying"]
    return {"": ("NIFTY and India VIX at the 12 Oct close", {**{k: u[k] for k in ("sym", "spot", "chg", "chg_pct", "vix")}, "as_of": x.C["source"]["as_of"]})}


def expiries(x: Chain, market):
    rows = [{k: e[k] for k in ("expiry", "days", "monthly", "future", "stats")} for e in x.C["expiries"]]
    return {"": ("every expiry with its summary (weekly ones marked)", {"as_of": x.C["source"]["as_of"], "expiries": rows})}


def _rows(x: Chain, date, strikes):
    e, spot = x.expiry(date), x.C["underlying"]["spot"]
    rows = e["rows"]
    if strikes == "near":
        i = next(n for n, r in enumerate(rows) if r["strike"] == e["stats"]["atm"])
        rows = rows[max(0, i - 10): i + 11]
    elif strikes == "band":
        rows = [r for r in rows if abs(r["strike"] - spot) <= spot * .05]
    return {"as_of": x.C["source"]["as_of"], "currency": "INR", "lot": x.C["underlying"]["lot"], "expiry": date, "strikes": strikes,
            "rows": [{"strike": r["strike"], **{s: {k: r[s][k] for k in SIDE_KEYS} for s in ("CE", "PE")}} for r in rows]}


def rows(x: Chain, market):
    monthly, weekly = x.default_expiry(), x.C["expiries"][0]["expiry"]
    return {"": ("the nearest monthly (the page's default), 21 strikes nearest the money", _rows(x, monthly, "near")),
            "_weekly_band": ("the nearest weekly, strikes within 5% (the 3 pm band)", _rows(x, weekly, "band"))}


SHORT = 30  # sessions of a later-starting extract: shows the nulls a short history gives


def _history(h: dict, start: int) -> dict:
    nifty, vix = h["nifty"][start:], h["vix"][start:]
    return {"dates": h["dates"][start:], "nifty": nifty, "vix": vix, "pcr": {k: v[start:] for k, v in h["pcr"].items()},
            "coverage": history_coverage(nifty, vix)}


def history(x: Chain, market):
    h = x.C["history"]
    return {"": (f"NIFTY, VIX and put-call ratio since {h['dates'][0]}, with coverage", _history(h, 0)),
            "_short": (f"the same series cut to the last {SHORT} sessions: the 3-month change and middle are null", _history(h, len(h["dates"]) - SHORT))}


def _contract(x: Chain, code):
    h = x.C["history"]
    c = h["contracts"][code]
    return {"code": code, "dates": h["dates"][c["from"]:c["from"] + len(c["close"])], "close": c["close"], "oi": c["oi"],
            "periods": contract_periods(len(c["close"]))}


def contract_history(x: Chain, market):
    atm = next(r for r in x.expiry(x.default_expiry())["rows"] if r["strike"] == x.expiry(x.default_expiry())["stats"]["atm"])
    contracts = x.C["history"]["contracts"]
    far = max(sorted(c for c in contracts if c.endswith("CE")), key=lambda c: len(contracts[c]["close"]))  # first of the longest
    near, long = _contract(x, atm["CE"]["code"]), _contract(x, far)
    return {"": (f"the nearest monthly's ATM call: history from {near['dates'][0]} ({len(near['dates'])} sessions)", near),
            "_long": (f"the call with the longest history, {far} ({len(long['dates'])} sessions: every period covered)", long)}


def sources(x: Chain, market):
    c = x.C
    return {"": ("sources, the quotes' status and the books' state", {"source": c["source"], "quotes": c["quotes"], "computed": c["computed"], "books": c["books"]})}
