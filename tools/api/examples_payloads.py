"""Block payloads built from the signed-off mockups' example data (design/mockups/30-shell/data.json and
31-dashboard/data.json, both labelled Mock). Each builder returns {example name suffix: (summary, payload)}; nothing
here invents a value: a value either comes from the mockups' data or is computed from it (sorting, filtering)."""

from __future__ import annotations

FAMILY_ORDER = ("rule", "hybrid", "ai", "baseline", "manual")


class Mock:
    def __init__(self, shell: dict, home: dict):
        self.S, self.H = shell, home

    def m(self, market):
        return self.S["markets"][market]

    def h(self, market):
        return self.H["markets"][market]

    def item(self, market, iid):
        return self.m(market)["items"][iid]

    def cur(self, market):
        return self.m(market)["currency"]


def frame_markets(x: Mock, market):
    return {"": ("both markets", {"markets": [
        {"market": k, "label": v["label"], "exchange": v["exchange"], "currency": v["currency"], "zone": v["zone"], "fno": v["fno"]}
        for k, v in x.S["markets"].items()]})}


def approaches(x: Mock, market):
    fam = x.S["families"]
    return {"": ("approaches", {"families": [{"family": f, **fam[f]} for f in FAMILY_ORDER],
                                "family_text": x.m(market)["family_text"], "pick_rules": x.S["pick_rules"]})}


def price_sources(x: Mock, market):
    used = {it["source"] for it in x.m(market)["items"].values()}
    return {"": ("the sources this market's prices use", {"sources": {k: v for k, v in x.S["sources"].items() if k in used}})}


def session(x: Mock, market):
    st, mk = x.m(market)["status"], x.m(market)
    return {"": ("closed: before the 7 Oct open in the US, after the close in India", {
        "exchange": mk["exchange"], "zone": mk["zone"], "session_date": st["session_date"], "open_utc": st["open_utc"],
        "close_utc": st["close_utc"], "next_open_utc": st["next_open_utc"], "regime": st["regime"],
        "post_close_at": st["runs"]["post_close"]["next_at"]})}


def _level(it, role):
    return {"id": it["id"], "sym": it["sym"], "name": it["name"], "role": role, "last": it["last"], "chg_pct": it["chg_pct"],
            "chg_5d_pct": it["chg_5d_pct"], "as_of": it["as_of"], "source": it["source"]}


def indices(x: Mock, market):
    ids = x.m(market)["indices"]
    return {"": ("benchmark and volatility index", {"indices": [_level(x.item(market, i), r) for i, r in zip(ids, ("benchmark", "vol_index"))]})}


def tracked_moves(x: Mock, market):
    rows = [it for it in x.m(market)["items"].values() if it["kind"] == "stock" and it.get("state") == "active"]
    rows.sort(key=lambda it: -it["chg_pct"])
    return {"": ("active companies, highest change first", {"companies": [
        {k: it[k] for k in ("id", "sym", "last", "chg_pct", "as_of", "source")} for it in rows]})}


def notifications(x: Mock, market):
    return {"": ("run events and alerts", {"notifications": x.S["notifications"][market]})}


def _strategies(x: Mock, market):
    out = []
    for g in x.h(market)["approaches"]:
        out += [{"id": s["id"], "name": s["name"], "family": g["family"]} for s in g.get("strategies", [])]
    return out


def _news_hit(entry):
    _, source, ticker = entry["sub"].split(" · ")
    return {"title": entry["label"], "source": source, "tickers": [ticker]}


def search(x: Mock, market):
    def run(q):
        words = q.lower().split()
        hit = lambda text: all(w in text.lower() for w in words)  # noqa: E731
        inst = [it for it in x.m(market)["items"].values() if it["kind"] in ("stock", "index") and hit(f"{it['id']} {it['sym']} {it['name']}")]
        return {"q": q, "currency": x.cur(market),
                "instruments": [{**{k: it[k] for k in ("id", "sym", "name", "code", "kind", "last", "chg_pct", "as_of", "source")},
                                 "state": it.get("state", "active")} for it in inst],
                "strategies": [s for s in _strategies(x, market) if hit(s["name"])],
                "news": [_news_hit(e) for e in x.m(market)["search_extra"] if e["kind"] == "news" and hit(f"{e['label']} {e['sub']}")]}
    if market == "india":
        return {"": ("a company: its stock and its news", run("reliance")), "_strategies": ("words that match strategies", run("news"))}
    return {"": ("a company by name", run("nvidia"))}


def fno_search(x: Mock, market):
    def run(q):
        words = q.lower().split()
        rows = [it for it in x.m(market)["items"].values() if it["kind"] in ("future", "option")
                and all(w in f"{it['code']} {it['sym']}".lower() for w in words)]
        return {"q": q, "currency": "INR", "contracts": [
            {k: it[k] for k in ("id", "sym", "name", "code", "kind", "underlying", "lot", "last", "chg_pct", "as_of", "source")} for it in rows]}
    return {"": ("an NSE code (labelled example prices)", run("NIFTY26OCT22800CE")), "_words": ("words", run("nifty 22800"))}


def instrument(x: Mock, market):
    def one(iid):
        it = x.item(market, iid)
        return {**{k: it[k] for k in ("id", "sym", "name", "code", "kind", "last", "chg_pct", "as_of", "source")}, "currency": x.cur(market),
                "state": it.get("state", "active"), "spark": it.get("spark"), "note": it.get("note")}
    if market == "india":
        return {"": ("a tracked stock", one("RELIANCE")), "_inactive": ("an inactive company: its last close", one("INDIGO"))}
    return {"": ("a tracked stock", one("AAPL"))}


def fno_contract(x: Mock, market):
    def one(code):
        it = x.item(market, code)
        return {**{k: it[k] for k in ("id", "sym", "name", "code", "kind", "underlying", "lot", "last", "chg_pct", "as_of", "source")},
                "currency": "INR", "bid": it.get("bid"), "ask": it.get("ask"), "iv": it.get("iv"), "note": it.get("note")}
    return {"": ("an option in the 3 pm snapshot (executable)", one("NIFTY26OCT22800CE")),
            "_stale": ("an option with only an old end-of-day price (refused)", one("NIFTY26NOV22000PE")),
            "_future": ("a future (end-of-day price only: refused)", one("NIFTY26OCTFUT"))}


def accounts(x: Mock, market):
    accs, mine = x.m(market)["accounts"], next(g for g in x.h(market)["approaches"] if g["family"] == "manual")["account"]
    manual = next(a for k, a in accs.items() if a["kind"] == "manual")
    mid = next(k for k, a in accs.items() if a["kind"] == "manual")
    held = next(it for it in x.m(market)["items"].values() if it.get("held", {}).get("account") == mid)
    m = {"id": mid, "name": manual["name"], "kind": "manual", "approach": "manual", "capital": manual["capital"], "cash": manual["cash"],
         "value": mine["value"], "open_profit": mine["open_profit"], "as_of": held["as_of"], "capital_note": manual["capital_note"]}
    if x.m(market)["fno"]:
        m.update(open_structures=manual["open_structures"], at_risk=manual["at_risk"])
    strategies = [{"id": k, "name": a["name"], "kind": "strategy", "approach": a["approach"]}
                  for k, a in accs.items() if a["kind"] == "strategy" and not k.startswith("fno-")]
    return {"": ("the Manual account and the strategies' accounts", {"currency": x.cur(market), "accounts": {"manual": m, "strategies": strategies}})}


def positions(x: Mock, market):
    rows = [{"id": p["id"], "account": p["account"], "qty": p["qty"], "avg": p["avg"], "last": x.item(market, p["id"])["last"],
             "unrealised": p["unrealised"], "as_of": x.item(market, p["id"])["as_of"], "price_source": x.item(market, p["id"])["source"],
             "source": p["source"]} for p in x.h(market)["own"]]
    return {"": ("the owner's own open paper trades", {"currency": x.cur(market), "own": rows})}


def order_rules(x: Mock, market):
    ch = x.m(market)["charges"]
    kind = "equity_delivery" if "equity_delivery" in ch else "equity"
    return {"": ("stock charges and the next price check", {"currency": x.cur(market),
            "charges": {"label": ch["label"], "kind": kind, "rates": ch[kind]}, "next_quotes": {"stock": x.m(market)["next_quotes"]["stock"]}})}


def fno_order_rules(x: Mock, market):
    mk = x.m(market)
    return {"": ("option charges, owner limits, margin, next snapshot", {"currency": "INR",
            "charges": {"label": mk["charges"]["label"], "kind": "option", "rates": mk["charges"]["option"]}, "limits": mk["limits"],
            "short_option_margin_per_lot": mk["short_option_margin_per_lot"], "next_quotes": {"option": mk["next_quotes"]["option"]}})}
