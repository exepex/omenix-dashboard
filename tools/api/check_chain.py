"""The option chain's semantic checks (32-option-chain; stories W13 and judge 38), used by check_contract.py:
  coverage  each change, 3-month middle and contract period recomputed from its series (null when not covered)
  values    each computed figure recomputed from its inputs the F&O tool's way (fno/analytics.py): the range priced in,
            the ATM strike (nearest spot, a tie to the lower), the straddle, every break-even, and on the full strike
            set the put-call ratio, the walls and max pain; monthly = the last listed expiry of its month"""

from __future__ import annotations

import copy

from examples_chain import contract_periods, history_coverage
from walk import block_operations


def check_coverage(found: dict, problems: list[str]) -> None:
    for key, value in found.get("getChainHistory", {}).items():
        p = value["payload"]
        if any(len(p[s]) != len(p["dates"]) for s in ("nifty", "vix")) or any(len(v) != len(p["dates"]) for v in p["pcr"].values()):
            problems.append(f"chain history example {key}: a series is not aligned to its dates")
        if p["coverage"] != history_coverage(p["nifty"], p["vix"]):
            problems.append(f"chain history example {key}: the coverage is not what its series give (null when not covered)")
    for key, value in found.get("getContractHistory", {}).items():
        p = value["payload"]
        if not len(p["dates"]) == len(p["close"]) == len(p["oi"]) or p["periods"] != contract_periods(len(p["dates"])):
            problems.append(f"contract history example {key}: the periods are not what its {len(p['dates'])} sessions give")


def strike_stats(rows: list, spot: float, full: bool) -> dict:
    """The stats one expiry's rows give; the put-call ratio, walls and max pain need every strike in the file (full)."""
    atm = min((r["strike"] for r in rows), key=lambda k: (abs(k - spot), k))
    leg = next(r for r in rows if r["strike"] == atm)
    out = {"atm": atm, "straddle": round(leg["CE"]["close"] + leg["PE"]["close"], 2)}
    if full:
        above, below = [r for r in rows if r["strike"] >= spot], [r for r in rows if r["strike"] <= spot]
        top = lambda rs, side, k: max(rs, key=lambda r: r[side][k])["strike"]  # noqa: E731
        pain = lambda s: sum(r["CE"]["oi"] * max(0, s - r["strike"]) + r["PE"]["oi"] * max(0, r["strike"] - s) for r in rows)  # noqa: E731
        calls = sum(r["CE"]["oi"] for r in rows)
        out.update(pcr=round(sum(r["PE"]["oi"] for r in rows) / calls, 2) if calls else None, max_pain=min((r["strike"] for r in rows), key=pain),
                   call_wall=top(above, "CE", "oi"), put_wall=top(below, "PE", "oi"), call_add=top(above, "CE", "oi_chg"), put_add=top(below, "PE", "oi_chg"))
    return out


def check_values(found: dict, problems: list[str]) -> None:
    spot = found["getChainUnderlying"]["india"]["payload"]["spot"]
    expiries = found["getChainExpiries"]["india"]["payload"]["expiries"]
    last = {}
    for e in expiries:
        last[e["expiry"][:7]] = e["expiry"]
        if e["stats"]["range"] != [round(spot - e["stats"]["straddle"], 2), round(spot + e["stats"]["straddle"], 2)]:
            problems.append(f"chain expiry {e['expiry']}: range is not spot ± straddle")
    problems += [f"chain expiry {e['expiry']}: monthly is not 'the last listed expiry of its month'" for e in expiries if e["monthly"] != (last[e["expiry"][:7]] == e["expiry"])]
    stats = {e["expiry"]: e["stats"] for e in expiries}
    for key, value in found["getChainRows"].items():
        p = value["payload"]
        for r in p["rows"]:
            if r["CE"]["breakeven"] != round(r["strike"] + r["CE"]["close"], 2) or r["PE"]["breakeven"] != round(r["strike"] - r["PE"]["close"], 2):
                problems.append(f"chain rows example {key}: the break-even of {r['strike']} is not strike ± close")
        for k, v in strike_stats(p["rows"], spot, p["strikes"] == "all").items():
            if stats[p["expiry"]][k] != v:
                problems.append(f"chain rows example {key}: {p['expiry']}'s {k} is {stats[p['expiry']][k]}, its rows give {v}")


def check_chain(found: dict, problems: list[str]) -> None:
    check_coverage(found, problems)
    check_values(found, problems)


def _traded(v):
    return next(s for r in v["payload"]["rows"] for s in (r["CE"], r["PE"]) if s["volume"] > 0)


def _expiry(v, date):
    return next(e for e in v["payload"]["expiries"] if e["expiry"] == date)


BREAKS = (  # judge 38's plants and the builder's: label, operation, example, change; each must fail the schema or check_chain
    ("the chain served for the US (G8)", "getChainRows", "india", lambda v: v.update(market="us")),
    ("a bid on a chain row (quotes not published)", "getChainRows", "india", lambda v: v["payload"]["rows"][0]["CE"].update(bid=1.0)),
    ("a chain row without the page's as_of", "getChainRows", "india", lambda v: v["payload"].pop("as_of")),
    ("a 3-month NIFTY change on 30 sessions", "getChainHistory", "india_short", lambda v: v["payload"]["coverage"]["nifty"]["m3"].update(value=-7.63)),
    ("3M marked complete on a 52-session contract", "getContractHistory", "india", lambda v: v["payload"]["periods"]["m3"].update(complete=True, days=63)),
    ("a NIFTY 1M change not from its series", "getChainHistory", "india", lambda v: v["payload"]["coverage"]["nifty"]["m1"].update(value=-1.0)),
    ("a 3M VIX middle marked complete on 30 sessions", "getChainHistory", "india_short", lambda v: v["payload"]["coverage"]["vix_middle_3m"].update(complete=True, days=63, value=12.0)),
    ("volume 0 with IV and Greeks kept (G1)", "getChainRows", "india", lambda v: _traded(v).update(volume=0)),
    ("a weekly carrying a future (G2)", "getChainExpiries", "india", lambda v: _expiry(v, "2026-10-13").update(future=22380.0)),
    ("a range that is not spot ± straddle (G3)", "getChainExpiries", "india", lambda v: _expiry(v, "2026-10-27")["stats"]["range"].__setitem__(0, 21800.0)),
    ("an ATM strike that is not the nearest (G4)", "getChainExpiries", "india", lambda v: _expiry(v, "2026-10-27")["stats"].update(atm=22400.0)),
    ("a break-even that is not strike ± close (G5)", "getChainRows", "india_weekly_band", lambda v: v["payload"]["rows"][0]["PE"].update(breakeven=1.0)),
    ("a weekly marked monthly, with a future (G6)", "getChainExpiries", "india", lambda v: _expiry(v, "2026-10-19").update(monthly=True, future=22390.0)),
    ("a put-call ratio not from the rows (G7)", "getChainExpiries", "india", lambda v: _expiry(v, "2026-10-27")["stats"].update(pcr=1.1)),
    ("a straddle that is not the ATM closes", "getChainExpiries", "india", lambda v: _expiry(v, "2026-10-27")["stats"].update(straddle=500.0, range=[21863.35, 22863.35])),
    ("a max pain not from the rows", "getChainExpiries", "india", lambda v: _expiry(v, "2026-10-27")["stats"].update(max_pain=22500.0)),
)


def planted(doc: dict, errors, found: dict, problems: list[str]) -> None:
    refs = {op["operationId"]: op["responses"]["200"]["content"]["application/json"]["schema"]["$ref"] for _, _, op in block_operations(doc)}
    for label, op_id, key, change in BREAKS:
        broken = copy.deepcopy(found)
        change(broken[op_id][key])
        caught = errors(refs[op_id], broken[op_id][key])
        check_chain(broken, caught)
        if not caught:
            problems.append(f"planted break not caught: {label}")
