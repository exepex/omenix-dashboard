"""Compose the platform mockups' payloads from the application's own example records (owner, 13 Oct 2026: "use real
wordings, labels and examples from the application").

    from real_data import shell_payload, home_payload

Sources (the stock tool's catalogue examples that the web app's tests also read): design/mockups/01-home/data.json
(market status, companies, strategies, agreement, head-to-head picks, open paper trades, to-date scoreboard, last EOD
analysis, news), 03-company/data.json (daily bars, events, each strategy's record on each company) and
07-paper-portfolios/data.json (the owner's own paper trades). Every stock name, ticker, strategy id and name, price,
pick, probability, cost figure, event and headline below is copied from those records; nothing is invented for stocks.

Not in this repository yet, so labelled EXAMPLE in the payload: F&O contract prices (the F&O tool's read models),
the proposed Manual paper account's starting cash (an owner decision) and the F&O books' state, which follows the
orchestrator's statement of 13 Oct 2026 that no F&O strategy has passed testing (Experiment 1 has not run).
Deterministic: the clock is the catalogue's cut-off; nothing reads the wall clock.
"""
from __future__ import annotations

import json
import os
import re

MOCKUPS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load(page: str) -> dict:
    with open(os.path.join(MOCKUPS, page, "data.json"), encoding="utf-8") as handle:
        return json.loads(handle.read().replace(": NaN", ": null"))


HOME, COMPANY, PORTFOLIOS = load("01-home"), load("03-company"), load("07-paper-portfolios")
NOW = HOME["cutoff"]                                    # 2026-10-07T12:00:00Z: 17:30 IST, 08:00 ET
CLOSE_AT = {"india": "T10:00:00Z", "us": "T20:00:00Z"}  # the exchanges' close in UTC (15:30 IST, 16:00 ET)
# the three approaches (owner, 13 Oct 2026), in this order, plus the baselines as the comparison line
FAMILY = {"rule": ("Rule-based", "rule", "Rule-based"), "hybrid": ("Hybrid", "bolt", "Hybrid: AI team within the rules"),
          "ai": ("AI team", "smart_toy", "AI team, fully autonomous"), "baseline": ("Baselines", "trending_flat", "Baselines")}
# F&O books (exepex/trading design section 12, stories E5, F5, F6; orchestrator, 13 Oct 2026): one approach each
BOOK_FAMILY = {1: "rule", 2: "hybrid", 3: "ai"}


def family_text(m: str) -> dict:
    """Plain words for each approach; F&O is named only in India (it is absent in the US)."""
    fno = m == "india"
    return {
        "manual": "Trades you place yourself.",
        "rule": "Rules read the data, use a standard strategy or invent a new one, and predict the price. No AI is involved. Stocks: for example “Model + news”." + (" F&O: Book 1." if fno else ""),
        "hybrid": "The AI team does the analysis and research, but acts only inside the rule-based limits. Stocks: planned, no hybrid stock strategy yet." + (" F&O: Book 2." if fno else ""),
        "ai": "A team of AI agents with different roles decides on its own: it uses an existing strategy or invents a new one." + (" F&O: Book 3." if fno else ""),
        "baseline": "Simple yardsticks a strategy has to beat (“Always buy”, “Follow yesterday”, “Model without news”); never in the head-to-head.",
    }
NEXT_OPEN = {"india": "2026-10-08T03:45:00Z", "us": "2026-10-07T13:30:00Z"}   # Thu 8 Oct 09:15 IST; today 09:30 ET
EXAMPLE_OPEN_NOW = {"india": "2026-10-07T05:43:00Z", "us": "2026-10-07T14:30:00Z"}  # #clock=open: the intraday check (11:13 IST), 10:30 ET
EXAMPLE = "EXAMPLE value: the F&O tool's read model is not in this repository yet."
r2 = lambda x: round(x, 2)


def stock_items(m: str) -> dict:
    P, pages = HOME["markets"][m], COMPANY["markets"][m]["pages"]
    out = {}
    for c in P["companies"]:
        bars = pages.get(c["ticker"], {}).get("bars", [])
        closes = [b["close"] for b in bars][-30:]
        prev = closes[-2] if len(closes) > 1 else None
        chg = c["change_pct"] if c["change_pct"] is not None else (r2((closes[-1] / prev - 1) * 100) if prev else None)
        out[c["ticker"]] = {"id": c["ticker"], "kind": "stock", "sym": c["ticker"], "code": c["ticker"],
                            "name": f"{c['name']} · {c.get('exchange') or ('NSE' if m == 'india' else 'US')}",
                            "last": c["last_close"], "chg_pct": chg if chg is not None else 0.0, "source": "close",
                            "as_of": c["last_close_date"] + CLOSE_AT[m], "state": c["state"], "spark": closes or None,
                            "fno": m == "india" and c["state"] == "active"}
        if c["state"] != "active":
            out[c["ticker"]]["note"] = "No longer tracked by the stock tool (inactive): the price is its last recorded close."
    for key in ("benchmark", "vol_index"):
        b = P["status"][key]
        out[b["symbol"]] = {"id": b["symbol"], "kind": "index", "sym": b["name"].upper() if m == "india" else b["symbol"], "code": b["symbol"],
                            "name": ("Index · NSE" if key == "benchmark" else "Volatility index · NSE") if m == "india" else (b["name"] + (" · NYSE Arca" if key == "benchmark" else " · Cboe")),
                            "last": r2(b["close"]), "chg_pct": b["change_pct"], "chg_5d_pct": b["change_5d_pct"], "source": "close",
                            "as_of": b["close_date"] + CLOSE_AT[m], "fno": m == "india" and key == "benchmark"}
    return out


def fno_items(spot: float) -> dict:
    """NIFTY monthly contracts in NSE trading-symbol form; prices are EXAMPLES around the real NIFTY close."""
    def opt(code, sym, last, chg, bid, ask, iv, src="snap3pm", as_of="2026-10-07T09:30:00Z", **kw):
        return {"id": code, "kind": "option", "sym": sym, "code": code, "name": "Option · lot 75", "last": last, "chg_pct": chg,
                "bid": bid, "ask": ask, "iv": iv, "source": src, "as_of": as_of, "underlying": "NIFTY", "lot": 75, "example": EXAMPLE, **kw}
    items = {
        "NIFTY26OCTFUT": {"id": "NIFTY26OCTFUT", "kind": "future", "sym": "NIFTY 27 OCT FUT", "code": "NIFTY26OCTFUT", "name": "Future · lot 75",
                          "last": r2(spot * 1.0029), "chg_pct": 0.95, "source": "eod", "as_of": "2026-10-06T12:30:00Z", "underlying": "NIFTY", "lot": 75, "example": EXAMPLE},
        "NIFTY26OCT22800CE": opt("NIFTY26OCT22800CE", "NIFTY 27 OCT 22800 CE", 281.40, 21.3, 280.60, 282.10, 13.1),
        "NIFTY26OCT22800PE": opt("NIFTY26OCT22800PE", "NIFTY 27 OCT 22800 PE", 292.75, -24.6, 292.00, 293.50, 13.6),
        "NIFTY26OCT23100CE": opt("NIFTY26OCT23100CE", "NIFTY 27 OCT 23100 CE", 158.20, 26.8, 157.70, 158.80, 12.7),
        "NIFTY26OCT23300CE": opt("NIFTY26OCT23300CE", "NIFTY 27 OCT 23300 CE", 92.40, 29.5, 92.00, 92.80, 12.4),
        "NIFTY26OCT22500PE": opt("NIFTY26OCT22500PE", "NIFTY 27 OCT 22500 PE", 168.35, -27.1, 167.80, 168.90, 14.4),
        "NIFTY26NOV22000PE": {**opt("NIFTY26NOV22000PE", "NIFTY 23 NOV 22000 PE", 196.10, -9.4, None, None, None, src="eod", as_of="2026-10-01T12:30:00Z"),
                              "bid": None, "ask": None, "iv": None, "note": "No trades since 1 Oct: the last end-of-day price is old."},
    }
    return items


def manual_account(m: str) -> dict:
    """The proposed Manual paper account (PLATFORM_DESIGN.md section 5): owner-changeable starting cash, holding the
    owner's real own paper trades of 07-paper-portfolios."""
    own = PORTFOLIOS["markets"][m]["owner"]["positions"]
    capital = 500000.0 if m == "india" else 5000.0   # owner, 13 Oct 2026: Rs 5 lakh in India, $5,000 in the US
    cost = sum(p["cost"] for p in own)
    return {"name": "Your paper account", "kind": "manual", "approach": "manual", "currency": HOME["markets"][m]["currency"],
            "capital": capital, "cash": r2(capital - cost), "open_structures": 0, "at_risk": 0,
            "capital_note": "Proposed starting cash (owner-changeable); the trades in it are your real paper trades."}


MODEL = re.compile(r"\s*\((?:Sonnet|Opus|Haiku)[^)]*\)")


AI_TEAM = "AI team"


def display_names(m: str) -> dict:
    """Strategy id -> the name users see. AI-based decisions come from one AI team: several agents, each with its own
    expertise, deciding together (owner, 13 Oct 2026); the earlier model-versus-model AI strategies are not shown one by
    one, and no AI model is ever named. Today's example records still come from those earlier strategies."""
    S = HOME["markets"][m]["strategies"]
    return {k: AI_TEAM if v["family"] == "ai" else MODEL.sub("", v["name"]) for k, v in S.items()}


def signals(m: str) -> list:
    """Today's buy picks of the head-to-head (one per family and pick rule, merged when both rules pick the same trade),
    with the agreement at that horizon and the picking strategy's own record on this company."""
    P, pages = HOME["markets"][m], COMPANY["markets"][m]["pages"]
    rows = {}
    for k in P["head_to_head"]:
        if k["status"] != "picked":
            continue
        key = (k["ticker"], k["family"], k["strategy_id"], k["horizon_days"])
        if key in rows:
            rows[key]["pick_rules"].append(k["pick_rule"])
            continue
        agree = next(r for r in P["agreement"][str(k["horizon_days"])] if r["ticker"] == k["ticker"])
        rec = next((o for o in pages.get(k["ticker"], {}).get("on_company", []) if o["strategy_id"] == k["strategy_id"]), None)
        rows[key] = {"id": k["ticker"], "family": k["family"], "strategy_id": k["strategy_id"], "strategy": display_names(m)[k["strategy_id"]],
                     "pick_rules": [k["pick_rule"]], "horizon": k["horizon_days"], "prob_up": k["prob_up"], "move_pct": k["move_pct"],
                     "loss_pct": k["loss_pct"], "costs_pct": k["costs_pct"], "exp_gain_pct": k["expected_gain_pct"], "amount": k["amount"],
                     "agree": {"buy": agree["buy"], "of": agree["of"], "by_family": agree["by_family"]},
                     "record": {"trades": rec["trades"], "win_rate": rec["win_rate"], "net_pnl": rec["net_pnl"], "badge": rec["sample_badge"]} if rec else None}
    no_pick = [k["ticker"] for k in P["head_to_head"] if k["status"] == "no_candidate"]
    return sorted(rows.values(), key=lambda r: (-r["exp_gain_pct"], -r["prob_up"])), sorted(set(no_pick))


def shell_payload() -> dict:
    markets = {}
    for m in ("india", "us"):
        P = HOME["markets"][m]
        items = stock_items(m)
        if m == "india":
            items.update(fno_items(P["status"]["benchmark"]["close"]))
        own = PORTFOLIOS["markets"][m]["owner"]["positions"]
        for p in own:
            items[p["ticker"]]["held"] = {"account": "manual-" + ("in" if m == "india" else "us"), "qty": p["quantity"], "avg": p["avg_price"]}
        sig, no_pick = signals(m)
        accounts = {("manual-in" if m == "india" else "manual-us"): manual_account(m),
                    f"h2h-rule-{m}": {"name": "Rule-based · stocks", "kind": "strategy", "approach": "rule", "currency": P["currency"]},
                    f"h2h-ai-{m}": {"name": "AI-based · stocks", "kind": "strategy", "approach": "ai", "currency": P["currency"]}}
        if m == "india":
            for i in (1, 2, 3):
                accounts[f"fno-b{i}"] = {"name": f"{FAMILY[BOOK_FAMILY[i]][0]} · F&O Book {i}", "kind": "strategy", "approach": BOOK_FAMILY[i], "currency": "INR"}
        status = P["status"]
        markets[m] = {
            "label": "India" if m == "india" else "US", "exchange": status["name"], "currency": P["currency"],
            "zone": "IST" if m == "india" else "ET", "offset_min": 330 if m == "india" else -240, "fno": m == "india",
            "indices": [status["benchmark"]["symbol"], status["vol_index"]["symbol"]], "items": items,
            "status": {"session_date": status["session"]["session_date"], "regime": status.get("regime"), "runs": status["runs"],
                       "open_utc": status["session"]["session_open_utc"].replace("+00:00", "Z"), "close_utc": status["session"]["session_close_utc"].replace("+00:00", "Z"),
                       "next_open_utc": NEXT_OPEN[m], "example_open_now": EXAMPLE_OPEN_NOW[m]},
            "watchlists": [{"name": "Tracked companies", "items": [c["ticker"] for c in P["companies"]]}],
            "accounts": accounts, "signals": sig, "no_pick": no_pick, "family_text": family_text(m),
            "example_note": "EXAMPLE DATA copied from the application's own catalogue records (stock tool example files of 6-7 Oct 2026). " + ("F&O contract prices and the Manual account's starting cash are labelled examples." if m == "india" else "The Manual account's starting cash is a labelled example.") + " Nothing here places a real order.",
            "default_amount": P["companies"][0]["amount"],
            "go_live": P["go_live"],
            "recent": [c["ticker"] for c in P["companies"] if c["state"] == "active"][:3],
            "search_extra": [{"kind": "strategy", "label": name, "sub": "Strategy"} for name in dict.fromkeys(display_names(m).values())]
                            + [{"kind": "news", "label": n["title"], "sub": f"News · {n['source']} · {', '.join(n['tickers']) or 'market'}"} for n in P["news"][:12]],
        }
        if m == "india":
            markets[m]["limits"] = {"max_loss_per_trade": 10000, "max_open_structures": 3, "max_at_risk": 30000}
            markets[m]["charges"] = {"label": "Example rates (the C1 charges code supplies the real schedule)",
                                     "equity_delivery": {"brokerage_flat": 20, "stt_pct": 0.1, "exchange_pct": 0.00297, "sebi_pct": 0.0001, "stamp_buy_pct": 0.015, "gst_pct": 18},
                                     "option": {"brokerage_flat": 20, "stt_sell_pct": 0.1, "exchange_pct": 0.03503, "sebi_pct": 0.0001, "stamp_buy_pct": 0.003, "gst_pct": 18}}
            markets[m]["short_option_margin_per_lot"] = 118000
            markets[m]["next_quotes"] = {"stock": "the stock tool's next price check (8 Oct, first run after 09:15 IST)", "option": "the next 3 pm snapshot (8 Oct)"}
            items_ = markets[m]["items"]
            def credit(legs): return sum((items_[i]["bid"] if sd == "sell" else -items_[i]["ask"]) * n for i, sd, n in legs)
            fly = [("NIFTY26OCT22800CE", "sell", 1), ("NIFTY26OCT22800PE", "sell", 1), ("NIFTY26OCT23100CE", "buy", 1), ("NIFTY26OCT22500PE", "buy", 1)]
            bull = [("NIFTY26OCT22800CE", "buy", 1), ("NIFTY26OCT23100CE", "sell", 1)]
            cf, cb = credit(fly), credit(bull)
            legs = lambda L: [{"id": i, "side": sd, "lots": n} for i, sd, n in L]
            markets[m]["fno_example"] = {
                "note": "EXAMPLE state, not today: how F&O signals look once a book's strategy has passed testing. " + EXAMPLE,
                "rows": [{"basket": "IFLY-22800", "family": "hybrid", "strategy": "F&O Book 2 (example)", "name": "NIFTY 27 Oct short iron fly 22800 ±300", "pop": 61, "max_loss": r2((300 - cf) * 75), "credit": r2(cf * 75)},
                         {"basket": "BCS-22800-23100", "family": "rule", "strategy": "F&O Book 1 (example)", "name": "NIFTY 27 Oct bull call spread 22800 / 23100", "pop": 43, "max_loss": r2(-cb * 75), "debit": r2(-cb * 75)}],
                "baskets": {"IFLY-22800": {"name": "NIFTY 27 Oct short iron fly 22800 ±300", "kind": "credit", "width": 300, "pop": 61, "breakevens": [round(22800 - cf, 1), round(22800 + cf, 1)], "margin_per_lot": 52000, "legs": legs(fly)},
                            "BCS-22800-23100": {"name": "NIFTY 27 Oct bull call spread 22800 / 23100", "kind": "debit", "width": 300, "pop": 43, "breakevens": [round(22800 - cb, 1)], "margin_per_lot": 0, "legs": legs(bull)}}}
            markets[m]["fno_state"] = {"approved": False, "note": "No F&O strategy has passed testing yet: Experiment 1 has not run, so at 3 pm each F&O book recorded “no approved strategy”."}
        else:
            markets[m]["limits"] = {"max_loss_per_trade": None, "max_open_structures": None, "max_at_risk": None}
            markets[m]["charges"] = {"label": "Example rates (the stock tool's config/costs.yaml supplies the real schedule)", "equity": {"commission_flat": 0, "sec_sell_pct": 0.00278, "taf_per_share_sell": 0.000166}}
            markets[m]["next_quotes"] = {"stock": "the stock tool's next price check (7 Oct, after the 09:30 ET open)"}
    return {
        "_mock": True,
        "_note": "EXAMPLE DATA copied from the application's own catalogue records (design/mockups/01-home, 03-company, 07-paper-portfolios: stock tool example files of 6-7 Oct 2026). F&O contract prices and the Manual account's starting cash are labelled examples. Research and paper trading only: nothing here places a real order.",
        "page": "shell", "spec": "design/PLATFORM_DESIGN.md sections 1-3, 5, 6; owner feedback 13 Oct 2026",
        "now": NOW,
        "sources": {
            "close": {"label": "Last close", "detail": "the stock tool's daily close (its post-close run imports today's close at 17:45 IST or 18:15 ET)", "max_age_h": 30},
            "eod": {"label": "NSE end-of-day file", "detail": "NSE's daily F&O file, published after the close", "max_age_h": 78},
            "snap3pm": {"label": "3 pm option snapshot", "detail": "the F&O tool's 3 pm NIFTY monthly option quotes (best bid and ask only)", "max_age_h": 26},
        },
        "families": {k: {"label": v[0], "icon": v[1], "long": v[2]} for k, v in FAMILY.items()} | {"manual": {"label": "You", "icon": "account_circle", "long": "You"}},
        "pick_rules": {"best_expected_gain": "Best expected gain", "highest_probability": "Highest probability"},
        "limits_note": "Owner-changeable default (PLATFORM_DESIGN.md section 5): Rs 5 lakh with the F&O books' limits.",
        "markets": markets,
        "notifications": {
            "india": [
                {"icon": "schedule", "title": "Post-close run due at 17:45 IST", "sub": "Today's closes and settlements are not in yet: prices are the 6 Oct close", "unread": True},
                {"icon": "event", "title": "RBI policy decision today", "sub": "A major event: the strategies widen their ranges", "unread": True},
                {"icon": "newspaper", "title": "News run 15:47 IST: 37 new items", "sub": "1 promotional item on RELIANCE (it never supports a call)", "unread": False},
            ],
            "us": [
                {"icon": "schedule", "title": "Pre-open run done at 07:45 ET", "sub": "Post-close run due 18:15 ET", "unread": True},
                {"icon": "newspaper", "title": "News run 04:47 ET: 52 new items", "sub": "1 rumour on NVDA (it never supports a call)", "unread": False},
            ],
        },
    }


def home_payload(shell: dict) -> dict:
    out = {"_mock": True, "_note": shell["_note"], "page": "home", "spec": "design/PLATFORM_DESIGN.md section 4 #1; owner feedback 13 Oct 2026", "markets": {}}
    for m in ("india", "us"):
        P, pages, S = HOME["markets"][m], COMPANY["markets"][m]["pages"], shell["markets"][m]
        manual_id = "manual-in" if m == "india" else "manual-us"
        own = [{"id": p["ticker"], "account": manual_id, "qty": p["quantity"], "avg": p["avg_price"], "unrealised": p["pnl"], "family": "manual",
                "strategy": "Your trade", "source": "Recorded from Slack"} for p in PORTFOLIOS["markets"][m]["owner"]["positions"]]
        strat = [{"id": t["ticker"], "account": None, "qty": r2(t["quantity"]), "avg": t["entry_price"], "unrealised": t["unrealised_pnl"], "family": t["family"],
                  "strategy": display_names(m)[t["strategy_id"]], "strategy_id": t["strategy_id"], "horizon": t["horizon_days"], "exit": t["exit_date"], "amount": t["amount"]}
                 for t in P["open_trades"]]
        eod = P["eod"]["results"]
        to_date = {(r["family"], r["pick_rule"]): r for r in P["to_date"]}
        cur = P["currency"]
        manual = S["accounts"][manual_id]
        own_value = sum(p["qty"] * S["items"][p["id"]]["last"] for p in own)
        groups = [{"family": "manual", "lines": [{"label": "Your paper account", "value": r2(manual["cash"] + own_value), "pnl": r2(sum(p["unrealised"] for p in own)),
                                                 "pnl_label": "open profit", "sub": f"{len(own)} stock open · {manual['capital_note']}"}]}]
        book = lambda n: {"label": f"F&O Book {n}", "value": 500000.0, "pnl": 0.0, "pnl_label": "no trade yet",
                          "sub": "No approved strategy yet · loss limit used ₹0 of ₹30,000"}
        for fam in ("rule", "ai"):
            rows = [r for k, r in to_date.items() if k[0] == fam]
            settled = sum(r["trades"] for r in rows) if rows else 0
            net = rows[0]["net_pnl"] if rows else 0.0
            open_n = sum(1 for t in strat if t["family"] == fam)
            per = "₹1,00,000" if cur == "INR" else "$1,000"
            lines = [{"label": "Stocks · head-to-head portfolio", "value": None, "pnl": net, "pnl_label": "net so far", "sub": f"{settled} settled trade{'s' if settled != 1 else ''} · too few to rank · {per} a trade"},
                     {"label": f"Stocks · yesterday ({int(P['eod']['session_date'][8:10])} Oct)", "value": None, "pnl": eod[fam]["net_pnl"], "pnl_label": "settled", "sub": f"{eod[fam]['trades']} trades settled, {eod[fam]['wins']} won · {open_n} open now"}]
            if m == "india":
                lines.append(book({"rule": 1, "ai": 3}[fam]))
            groups.append({"family": fam, "lines": lines})
        hybrid_stocks = {"label": "Stocks", "value": None, "pnl": None, "pnl_label": "", "sub": "No hybrid stock strategy yet: planned (owner, 13 Oct 2026)"}
        groups.append({"family": "hybrid", "lines": [hybrid_stocks] + ([book(2)] if m == "india" else [])})
        order = {"manual": 0, "rule": 1, "hybrid": 2, "ai": 3}
        groups.sort(key=lambda g: order[g["family"]])
        groups.append({"family": "baseline", "lines": [
            {"label": f"Stocks · yesterday ({int(P['eod']['session_date'][8:10])} Oct)", "value": None, "pnl": eod["baseline"]["net_pnl"], "pnl_label": "settled",
             "sub": f"{eod['baseline']['trades']} trades settled, {eod['baseline']['wins']} won · {sum(1 for t in strat if t['family'] == 'baseline')} open now · the comparison line"}]})
        status = P["status"]
        seen, events = set(), []
        for pg in pages.values():
            for e in pg["events"]:
                k = (e["date"], e["name"])
                if k not in seen and e["date"] >= status["session"]["session_date"]:
                    seen.add(k); events.append({"date": e["date"], "title": e["name"], "kind": e["type"], "inst": e.get("ticker"), "major": e["major"]})
        events.sort(key=lambda e: e["date"])
        exits_today = [t for t in strat if t["exit"] == status["session"]["session_date"]]
        attention = []
        if exits_today:
            attention.append({"icon": "schedule", "tone": "info", "title": f"{len(exits_today)} paper trades exit today", "sub": f"{', '.join(sorted({t['id'] for t in exits_today}))} at N+{exits_today[0]['horizon']}: " + ", ".join(sorted({t['strategy'] for t in exits_today})), "inst": exits_today[0]["id"]})
        attention.append({"icon": "pending", "tone": "warn", "title": "Today's close is not in yet", "sub": f"Post-close run due {'17:45 IST' if m == 'india' else '18:15 ET'}: prices and P&L are the {int(P['companies'][0]['last_close_date'][8:10])} Oct close"})
        major = [e for e in events if e["date"] == status["session"]["session_date"] and e["major"]]
        if major:
            attention.append({"icon": "event", "tone": "primary", "title": f"{major[0]['title']} today", "sub": "A major event: the strategies widen their ranges today"})
        for n in P["news"]:
            if n["status"] in ("promotional", "rumour") and any(t in S["items"] for t in n["tickers"]):
                attention.append({"icon": "newspaper", "tone": "danger", "title": f"{n['status'].capitalize()} news on {n['tickers'][0]}", "sub": f"“{n['title'][:80]}” ({n['source']}): it never supports a call", "inst": n["tickers"][0]})
                break
        news = [{"title": n["title"], "src": n["source"], "status": n["status"] or "not_checked", "at": n["first_seen_at"], "tickers": n["tickers"]}
                for n in P["news"] if n["tickers"] and any(t in S["items"] for t in n["tickers"])][:2]
        news += [{"title": n["title"], "src": n["source"], "status": n["status"] or "not_checked", "at": n["first_seen_at"], "tickers": n["tickers"]}
                 for n in P["news"] if n["tickers"] and not any(t in S["items"] for t in n["tickers"])][:4 - len(news)]
        out["markets"][m] = {
            "session": {"date": status["session"]["session_date"], "in_session": status["session"]["in_session"], "regime": status.get("regime"),
                        "post_close_at": status["runs"]["post_close"]["next_at"]},
            "groups": groups, "own": own, "strategy_trades": strat, "attention": attention, "events": events[:6], "news": news,
            "eod_summary": P["eod"]["summary"],
        }
    return out
