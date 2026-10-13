"""What publishers store, checked against what the route serves (W11 follow-ups, 13 Oct 2026; judge 40;
api/schemas/blocks-stored.yaml):
  1. India's "ours" universe: the stock tool stores only the companies it follows; exepex/trading tags its NSE rows
     and counts "ours" over them (the inputs, such as delivery, are NSE's). Its tags and counts must equal that list's.
  2. The paged blocks (screener stocks, F&O screener rows) are stored whole; each served page is rows of that table."""

from __future__ import annotations

import copy

import examples
import examples_screens as screens
from walk import block_operations

SCHEMA = "#/components/schemas/"
SUMMARY, TABLE, FOLLOWED = "getScreenerSummaryIndia", "ScreenerStocksTableIndia", "FollowedCompaniesIndia"


def stored_values() -> dict[str, dict]:
    """Every stored part, built from the mockups' data (schema name -> value)."""
    x = screens.Screens(examples.load(examples.SCREENER), examples.load(examples.MARKETS))
    return {FOLLOWED: screens.followed_india(x), **screens.stored_tables(x)}


def parts_by_op(doc: dict) -> dict[str, dict]:
    """operationId -> {"x-stored": [...], "x-inputs": [...]} for the operations that name stored parts."""
    keys = ("x-stored", "x-inputs")
    return {op["operationId"]: {k: op.get(k, []) for k in keys} for _, _, op in block_operations(doc) if any(k in op for k in keys)}


def check_links(doc: dict, stored: dict, problems: list[str]) -> None:
    """Every stored part is named by an operation, carries who stores it, and has a value."""
    named = {n for parts in parts_by_op(doc).values() for names in parts.values() for n in names}
    for name in sorted(named | set(stored)):
        if name not in named or name not in stored or "x-stored-by" not in doc["components"]["schemas"].get(name, {}):
            problems.append(f"stored part {name}: needs an operation's x-stored or x-inputs, an x-stored-by and a value")


def check_followed(found: dict, stored: dict, problems: list[str]) -> None:
    followed, rows = set(stored[FOLLOWED]["companies"]), stored[TABLE]["rows"]
    tagged = {r["s"] for r in rows if "ours" in r["u"]}
    if tagged != followed:
        problems.append(f"{TABLE}: rows tagged ours {sorted(tagged ^ followed)} differ from the stock tool's followed list")
    ours = screens.counts([r for r in rows if r["s"] in followed], "india")
    if found[SUMMARY]["india"]["payload"]["universes"]["ours"] != ours:
        problems.append("India screener summary: the ours counts are not the NSE rows of the stock tool's followed companies")


def check_pages(doc: dict, found: dict, stored: dict, problems: list[str]) -> None:
    for op_id, parts in parts_by_op(doc).items():
        for name in parts["x-stored"]:
            table = stored[name]
            if table["total"] != len(table["rows"]):
                problems.append(f"{name}: total {table['total']} is not its {len(table['rows'])} rows")
            by_symbol = {r["s"]: r for r in table["rows"]}
            for key, value in found[op_id].items():
                page = value["payload"]
                if page["total"] > table["total"] or any(by_symbol.get(r["s"]) != r for r in page["rows"]):
                    problems.append(f"{op_id} example {key}: the page is not rows of the stored table {name}")


def check_stored(doc: dict, errors, found: dict, problems: list[str], stored: dict | None = None) -> dict:
    stored = stored_values() if stored is None else stored
    check_links(doc, stored, problems)
    for name, value in stored.items():
        problems += [f"stored {name}: {e}" for e in errors(SCHEMA + name, value)]
    check_followed(found, stored, problems)
    check_pages(doc, found, stored, problems)
    return stored


BREAKS = (  # label, stored part, change: each must make check_stored fail
    ("a followed company missing from the stock tool's list", FOLLOWED, lambda v: v["companies"].pop()),
    ("counts in the stock tool's list (it owns only the list)", FOLLOWED, lambda v: v.update(ours={"n": 20})),
    ("an NSE row tagged ours that the stock tool does not follow", TABLE, lambda v: next(r for r in v["rows"] if "ours" not in r["u"])["u"].append("ours")),
    ("a stored table whose total is not its rows", TABLE, lambda v: v.update(total=v["total"] - 1)),
    ("NSE delivery on a stored US row", "ScreenerStocksTableUs", lambda v: v["rows"][0].update(dl=50.0)),
    ("a served page row that is not the stored row", "FnoScreenerTable", lambda v: [r.update(oi=r["oi"] + 1) for r in v["rows"]]),
)


def planted(doc: dict, errors, found: dict, stored: dict, problems: list[str]) -> None:
    for label, name, change in BREAKS:
        broken = copy.deepcopy(stored)
        change(broken[name])
        caught: list[str] = []
        check_stored(doc, errors, found, caught, broken)
        if not caught:
            problems.append(f"planted break not caught: {label}")
