"""Home and picks block payloads built from the mockups' example data (see examples_payloads.py)."""

from __future__ import annotations

from examples_payloads import Mock


def picks(x: Mock, market):
    mk = x.m(market)
    out = {"": ("today's picks", {"currency": x.cur(market), "signals": mk["signals"], "no_pick": mk["no_pick"],
                                  "go_live": {k: mk["go_live"][k] for k in ("proven", "months_forward", "trades_needed")}})}
    return out


def fno_picks(x: Mock, market):
    mk = x.m(market)
    ex = mk["fno_example"]
    return {"": ("today: no approved F&O strategy (the honest empty state)", {"currency": "INR", "fno_state": mk["fno_state"], "rows": [], "baskets": {}}),
            "_example": ("EXAMPLE state, not today: how approved rows look", {"currency": "INR",
                         "fno_state": {"approved": True, "note": ex["note"]}, "rows": ex["rows"], "baskets": ex["baskets"]})}


def _result(s):
    return {k: s[k] for k in ("id", "name", "trades", "wins", "net")}


def _total(group):
    t = group["total"]
    if t is None:
        return None
    return {**{k: t[k] for k in ("net", "trades", "wins", "with_trades", "count")},
            "basis": "team_record" if group["family"] == "ai" else "strategies_sum"}


def groups(x: Mock, market):
    rows = {g["family"]: g for g in x.h(market)["approaches"]}
    out = [{"family": f, "total": _total(rows[f]), "strategies": [_result(s) for s in rows[f]["strategies"]], "empty": rows[f].get("empty")}
           for f in ("rule", "hybrid", "ai")]
    base = rows["baseline"]
    return {"": ("each group's own total; Baselines apart", {"currency": x.cur(market), "groups": out,
            "baselines": {"total": _total(base), "strategies": [_result(s) for s in base["strategies"]]}})}


def fno_books(x: Mock, market):
    snap = max(it["as_of"] for it in x.m(market)["items"].values() if it["source"] == "snap3pm")
    books = []
    for g in x.h(market)["approaches"]:
        b = g.get("book")
        if b:
            books.append({"book": int(b["name"].rsplit(" ", 1)[1]), "family": g["family"], "name": b["name"], "value": b["value"],
                          "pnl": b["pnl"], "approved": b["approved"], "limit_used": b["limit_used"], "limit_max": b["limit_max"], "as_of": snap})
    return {"": ("three books, no approved strategy yet", {"currency": "INR", "books": sorted(books, key=lambda b: b["book"])})}


def strategy_trades(x: Mock, market):
    keys = ("id", "family", "strategy_id", "strategy", "horizon", "qty", "avg", "unrealised", "exit", "amount")
    rows = [{**{k: t[k] for k in keys}, "as_of": x.item(market, t["id"])["as_of"]} for t in x.h(market)["strategy_trades"]]
    return {"": ("the strategies' open trades, one row each", {"currency": x.cur(market), "strategy_trades": rows})}


def attention(x: Mock, market):
    return {"": ("what needs the owner today", {"attention": [
        {k: a.get(k) for k in ("icon", "tone", "title", "sub", "inst")} for a in x.h(market)["attention"]]})}


def events(x: Mock, market):
    return {"": ("coming up", {"events": [{k: e[k] for k in ("date", "title", "kind", "major", "inst")} for e in x.h(market)["events"]]})}


def top_news(x: Mock, market):
    return {"": ("top news with verification status", {"news": [{k: n[k] for k in ("title", "src", "status", "at", "tickers")} for n in x.h(market)["news"]]})}
