"""What each publisher stores, checked against what the route serves (W11 follow-ups, 13 Oct 2026;
api/schemas/blocks-stored.yaml):
  1. India's screener summary is two stored parts, exepex/trading's NSE universes and the stock tool's own companies;
     the route's merge of them equals the served example and validates against the served schema.
  2. The paged blocks (screener stocks, F&O screener rows) are stored whole; each served page is rows of that table."""

from __future__ import annotations

import copy

import examples
import examples_screens as screens
from walk import block_operations

SCHEMA = "#/components/schemas/"
MERGED = "getScreenerSummaryIndia"  # the one block served as a merge of two publishers' parts


def merge_summary(nse: dict, ours: dict) -> dict:
    """The route's merge: the NSE universes plus the stock tool's, of one close (else the route answers 503)."""
    if nse["as_of"] != ours["as_of"]:
        raise ValueError(f"the parts are of different closes ({nse['as_of']}, {ours['as_of']})")
    return {"as_of": nse["as_of"], "universes": {**nse["universes"], "ours": ours["ours"]}}


def stored_values() -> dict[str, dict]:
    """Every stored part, built from the mockups' data (schema name -> value)."""
    x = screens.Screens(examples.load(examples.SCREENER), examples.load(examples.MARKETS))
    nse, ours = screens.summary_parts(x)
    return {"ScreenerSummaryNsePart": nse, "ScreenerSummaryOursPart": ours, **screens.stored_tables(x)}


def check_summary(errors, served: dict, stored: dict, problems: list[str]) -> None:
    try:
        merged = merge_summary(stored["ScreenerSummaryNsePart"], stored["ScreenerSummaryOursPart"])
    except ValueError as error:
        problems.append(f"India screener summary: {error}")
        return
    response = {**served, "payload": merged}
    problems += [f"merged India screener summary: {e}" for e in errors(SCHEMA + "ScreenerSummaryIndiaResponse", response)]
    if merged != served["payload"]:
        problems.append("merged India screener summary is not the served example")


def stored_by_op(doc: dict) -> dict[str, list]:
    """operationId -> the stored parts it serves (x-stored)."""
    return {op["operationId"]: op["x-stored"] for _, _, op in block_operations(doc) if "x-stored" in op}


def check_links(doc: dict, stored: dict, problems: list[str]) -> None:
    """Every stored part is named by an operation, carries who stores it, and has a value."""
    named = [n for names in stored_by_op(doc).values() for n in names]
    for name in sorted(set(named) | set(stored)):
        if name not in named or name not in stored or "x-stored-by" not in doc["components"]["schemas"].get(name, {}):
            problems.append(f"stored part {name}: needs an operation's x-stored, an x-stored-by and a value")


def check_pages(doc: dict, found: dict, stored: dict, problems: list[str]) -> None:
    for op_id, (name, *_) in stored_by_op(doc).items():
        if op_id == MERGED:
            continue
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
    check_summary(errors, found[MERGED]["india"], stored, problems)
    check_pages(doc, found, stored, problems)
    return stored


BREAKS = (  # label, stored part, change: each must make check_stored fail
    ("the stock tool's counts in the NSE part", "ScreenerSummaryNsePart", lambda v: v["universes"].update(ours=v["universes"]["all"])),
    ("an F&O universe in the stock tool's part", "ScreenerSummaryOursPart", lambda v: v.update(fno=v["ours"])),
    ("the two summary parts of different closes", "ScreenerSummaryOursPart", lambda v: v.update(as_of="2026-10-09T10:00:00Z")),
    ("a stored table whose total is not its rows", "ScreenerStocksTableIndia", lambda v: v.update(total=v["total"] - 1)),
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
