"""The contract's semantic checks (beyond JSON Schema), used by check_contract.py:
  check_views        a screen's view of a shared record is exactly its documented query on the record (events)
  check_home_events  Home's frozen "Coming up" stays the signed-off list; on the real calendar it keeps market events
                     (in India the stock tool's and exepex/trading's calendars merged, Home's query applied again: 2.5)
  check_flows        a flows period total exists only when the days cover the period, and equals their sum"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle  # noqa: E402
from examples_screens import flow_totals, view  # noqa: E402

CALENDARS = ("getEvents_", "getFnoEvents_")  # one calendar per publisher (2.5)


def check_views(doc: dict, problems: list[str]) -> None:
    """A screen's view of a shared record (an example with x-query) must be exactly that query applied to the record's
    full example (judge 27, finding 1: Home and the Markets overview read one calendar)."""
    examples = doc["components"]["examples"]
    for name, ex in examples.items():
        if "x-query" not in ex or not name.startswith(CALENDARS) or name.endswith("_calendar"):
            continue
        op, market = name.split("_")[0], ex["value"]["market"]
        full = examples.get(f"{op}_{market}_calendar")
        if full is None or ex["value"]["payload"]["events"] != view(full["value"]["payload"]["events"], ex["x-query"]):
            problems.append(f"example {name}: not its query {ex['x-query']} applied to {op}_{market}_calendar")


HOME_KEEPS = {"india": {"holiday", "fno_expiry", "fomc"}, "us": {"fomc", "jobs_report"}}  # judge 32


def merged(examples: dict, name: str) -> list:
    """A screen's list: the stock calendar's view and, in India, exepex/trading's expiries for the same query, merged
    and the query applied again (the client does the same)."""
    stock = examples[name]
    fno = examples.get(name.replace("getEvents_", "getFnoEvents_"))
    if fno is None:
        return stock["value"]["payload"]["events"]
    rows = sorted(stock["value"]["payload"]["events"] + fno["value"]["payload"]["events"], key=lambda e: (e["date"], e["inst"] is not None, e["title"]))
    return view(rows, stock["x-query"])


def check_home_events(doc: dict, problems: list[str]) -> None:
    """Home's frozen "Coming up" (31 row 6): its query over Home's own world gives the signed-off list exactly, and on
    the real 12 Oct calendar (20 companies) it keeps the market-wide events."""
    signed = json.loads((bundle.REPO / "design/mockups/31-dashboard/data.json").read_text(encoding="utf-8"))
    examples = doc["components"]["examples"]
    for market, keep in HOME_KEEPS.items():
        if merged(examples, f"getEvents_{market}") != signed["markets"][market]["events"]:
            problems.append(f"getEvents_{market}: Home's view is not the signed-off Coming up of 31-dashboard")
        kinds = {e["kind"] for e in merged(examples, f"getEvents_{market}_home20")}
        if not keep <= kinds:
            problems.append(f"getEvents_{market}_home20: Home's query on the real calendar drops {sorted(keep - kinds)}")


def check_flows(found: dict, problems: list[str]) -> None:
    """34 row 8: a period total exists only when the days cover the period, and equals the sum of those days."""
    for key, value in found.get("getFlows", {}).items():
        payload = value["payload"]
        if payload["totals"] != flow_totals(payload["days"]):
            problems.append(f"flows example {key}: the period totals are not the covered sums of its days (null when not covered)")

