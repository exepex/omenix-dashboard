"""Home's payload (design/mockups/31-dashboard), composed from the application's own example records like the shell's
(real_data.py). Owner, 13 Oct 2026: each group of "Who trades" leads with its total profit or loss (the sum of its own
strategies' paper results, one group at a time, never across groups, markets or the F&O book), and lists every strategy.
"""
from __future__ import annotations

from real_data import COMPANY, HOME, PORTFOLIOS, display_names, load, r2

STRATLAB = load("05-strategy-lab")
BOOK = {"rule": 1, "hybrid": 2, "ai": 3}


def strategy_records(m: str) -> dict:
    """strategy id -> its own forward record (accuracy view, all horizons): trades, wins, net P&L, sample badge."""
    rows = [r for r in STRATLAB["markets"][m]["rows"]
            if r["scope"] == "strategy" and r["view"] == "accuracy" and r["basis"] == "forward" and r["horizon_days"] == "all"]
    return {r["strategy_id"]: {"trades": r["trades"], "wins": round(r["win_rate"] * r["trades"]), "net": r["net_pnl"], "badge": r["sample_badge"]} for r in rows}


def approaches(m: str, S: dict, own: list, strat: list) -> list:
    P, names, recs = HOME["markets"][m], display_names(m), strategy_records(m)
    eod, to_date, india = P["eod"]["results"], P["to_date"], m == "india"
    per_trade = "₹1,00,000" if P["currency"] == "INR" else "$1,000"
    manual = S["accounts"]["manual-in" if india else "manual-us"]
    own_value = sum(p["qty"] * S["items"][p["id"]]["last"] for p in own)

    def h2h(fam):
        rows = [r for r in to_date if r["family"] == fam]
        if not rows:
            return None
        return {"net": rows[0]["net_pnl"], "trades": rows[0]["trades"], "wins": round(rows[0]["win_rate"] * rows[0]["trades"]), "badge": rows[0]["sample_badge"], "per_trade": per_trade}

    def strategies(fam):
        if fam == "ai":   # one AI team; the strategies it uses or invents are listed once it publishes them (owner, 13 Oct 2026)
            return []
        return [{"id": k, "name": names[k], "trades": (recs.get(k) or {}).get("trades", 0), "wins": (recs.get(k) or {}).get("wins", 0),
                 "net": (recs.get(k) or {}).get("net"), "badge": (recs.get(k) or {}).get("badge"),
                 "open_now": sum(1 for t in strat if t["strategy_id"] == k)} for k, v in P["strategies"].items() if v["family"] == fam]

    def book(fam):
        if not india or fam not in BOOK:
            return None
        return {"name": f"F&O Book {BOOK[fam]}", "value": 500000.0, "pnl": 0.0, "approved": [], "limit_used": 0.0, "limit_max": 150000.0}

    def total(fam, h2h_row, strats):
        """The group's profit or loss: its strategies' own results added up (the AI team is one team: its own record)."""
        if fam == "ai":
            return {"net": h2h_row["net"], "trades": h2h_row["trades"], "wins": h2h_row["wins"], "count": 1, "with_trades": 1} if h2h_row else None
        ran = [x for x in strats if x["trades"]]
        if not strats:
            return None
        return {"net": r2(sum(x["net"] for x in ran)), "trades": sum(x["trades"] for x in ran), "wins": sum(x["wins"] for x in ran),
                "count": len(strats), "with_trades": len(ran)}

    rows = [{"family": "manual", "account": {"value": r2(manual["cash"] + own_value), "open_profit": r2(sum(p["unrealised"] for p in own)),
                                             "cash": manual["cash"], "note": manual["capital_note"]}, "open_now": len(own)}]
    for fam in ("rule", "hybrid", "ai"):
        strats = strategies(fam) if fam != "hybrid" else []
        row = {"family": fam, "h2h": h2h(fam), "yesterday": dict(eod[fam]) if fam in eod else None, "strategies": strats,
               "total": total(fam, h2h(fam), strats), "book": book(fam), "open_now": sum(1 for t in strat if t["family"] == fam)}
        if fam == "hybrid":
            row["empty"] = "No hybrid stock strategy yet (planned)."
        rows.append(row)
    base = strategies("baseline")
    rows.append({"family": "baseline", "h2h": None, "yesterday": dict(eod["baseline"]), "strategies": base, "total": total("baseline", None, base), "book": None,
                 "open_now": sum(1 for t in strat if t["family"] == "baseline"), "comparison": True})
    return rows


def attention_events_news(m: str, S: dict, strat: list) -> tuple:
    P, pages, status = HOME["markets"][m], COMPANY["markets"][m]["pages"], HOME["markets"][m]["status"]
    seen, events = set(), []
    for pg in pages.values():
        for e in pg["events"]:
            k = (e["date"], e["name"])
            if k not in seen and e["date"] >= status["session"]["session_date"]:
                seen.add(k); events.append({"date": e["date"], "title": e["name"], "kind": e["type"], "inst": e.get("ticker"), "major": e["major"]})
    events.sort(key=lambda e: e["date"])
    today = status["session"]["session_date"]
    exits = [t for t in strat if t["exit"] == today]
    att = []
    if exits:
        att.append({"icon": "schedule", "tone": "info", "title": f"{len(exits)} paper trades exit today", "inst": exits[0]["id"],
                    "sub": f"{', '.join(sorted({t['id'] for t in exits}))} at N+{exits[0]['horizon']}: " + ", ".join(sorted({t['strategy'] for t in exits}))})
    att.append({"icon": "pending", "tone": "warn", "title": "Today's close is not in yet",
                "sub": f"Post-close run due {'17:45 IST' if m == 'india' else '18:15 ET'}: prices and P&L are the {int(P['companies'][0]['last_close_date'][8:10])} Oct close"})
    major = [e for e in events if e["date"] == today and e["major"]]
    if major:
        att.append({"icon": "event", "tone": "primary", "title": f"{major[0]['title']} today", "sub": "A major event: the strategies widen their ranges today"})
    for n in P["news"]:
        if n["status"] in ("promotional", "rumour") and any(t in S["items"] for t in n["tickers"]):
            att.append({"icon": "newspaper", "tone": "danger", "title": f"{n['status'].capitalize()} news on {n['tickers'][0]}", "inst": n["tickers"][0],
                        "sub": f"“{n['title'][:80]}” ({n['source']}): it never supports a call"})
            break
    item = lambda n: {"title": n["title"], "src": n["source"], "status": n["status"] or "not_checked", "at": n["first_seen_at"], "tickers": n["tickers"]}
    mine = [item(n) for n in P["news"] if n["tickers"] and any(t in S["items"] for t in n["tickers"])][:2]
    other = [item(n) for n in P["news"] if n["tickers"] and not any(t in S["items"] for t in n["tickers"])][:4 - len(mine)]
    return att, events[:6], mine + other


def home_payload(shell: dict) -> dict:
    out = {"_mock": True, "_note": shell["_note"], "page": "home", "spec": "design/PLATFORM_DESIGN.md section 4 #1; owner feedback 13 Oct 2026", "markets": {}}
    for m in ("india", "us"):
        P, S = HOME["markets"][m], shell["markets"][m]
        manual_id = "manual-in" if m == "india" else "manual-us"
        own = [{"id": p["ticker"], "account": manual_id, "qty": p["quantity"], "avg": p["avg_price"], "unrealised": p["pnl"], "family": "manual",
                "strategy": "Your trade", "source": "Recorded from Slack"} for p in PORTFOLIOS["markets"][m]["owner"]["positions"]]
        strat = [{"id": t["ticker"], "account": None, "qty": r2(t["quantity"]), "avg": t["entry_price"], "unrealised": t["unrealised_pnl"], "family": t["family"],
                  "strategy": display_names(m)[t["strategy_id"]], "strategy_id": t["strategy_id"], "horizon": t["horizon_days"], "exit": t["exit_date"], "amount": t["amount"]}
                 for t in P["open_trades"]]
        attention, events, news = attention_events_news(m, S, strat)
        status = P["status"]
        out["markets"][m] = {
            "session": {"date": status["session"]["session_date"], "in_session": status["session"]["in_session"], "regime": status.get("regime"),
                        "post_close_at": status["runs"]["post_close"]["next_at"], "eod_date": P["eod"]["session_date"]},
            "approaches": approaches(m, S, own, strat), "own": own, "strategy_trades": strat,
            "attention": attention, "events": events, "news": news, "eod_summary": P["eod"]["summary"],
        }
    return out
