"""The contract's semantic checks (beyond JSON Schema), used by check_contract.py:
  check_views        a screen's view of a shared record is exactly its documented query on the record (events)
  check_home_events  Home's frozen "Coming up" stays the signed-off list; on the real calendar it keeps market events
  check_flows        a flows period total exists only when the days cover the period, and equals their sum"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle  # noqa: E402
from examples_screens import flow_totals, view  # noqa: E402


def check_views(doc: dict, problems: list[str]) -> None:
    """A screen's view of a shared record (an example with x-query) must be exactly that query applied to the record's
    full example (judge 27, finding 1: Home and the Markets overview read one calendar)."""
    examples = doc["components"]["examples"]
    for name, ex in examples.items():
        if "x-query" not in ex or not name.startswith("getEvents_") or name.endswith("_calendar"):
            continue
        op, market = name.split("_")[0], ex["value"]["market"]
        full = examples.get(f"{op}_{market}_calendar")
        if full is None or ex["value"]["payload"]["events"] != view(full["value"]["payload"]["events"], ex["x-query"]):
            problems.append(f"example {name}: not its query {ex['x-query']} applied to {op}_{market}_calendar")


HOME_KEEPS = {"india": {"holiday", "fno_expiry", "fomc"}, "us": {"fomc", "jobs_report"}}  # judge 32


def check_home_events(doc: dict, problems: list[str]) -> None:
    """Home's frozen "Coming up" (31 row 6): its query over Home's own world gives the signed-off list exactly, and on
    the real 12 Oct calendar (20 companies) it keeps the market-wide events."""
    signed = json.loads((bundle.REPO / "design/mockups/31-dashboard/data.json").read_text(encoding="utf-8"))
    examples = doc["components"]["examples"]
    for market, keep in HOME_KEEPS.items():
        if examples[f"getEvents_{market}"]["value"]["payload"]["events"] != signed["markets"][market]["events"]:
            problems.append(f"getEvents_{market}: Home's view is not the signed-off Coming up of 31-dashboard")
        kinds = {e["kind"] for e in examples[f"getEvents_{market}_home20"]["value"]["payload"]["events"]}
        if not keep <= kinds:
            problems.append(f"getEvents_{market}_home20: Home's query on the real calendar drops {sorted(keep - kinds)}")


def check_flows(found: dict, problems: list[str]) -> None:
    """34 row 8: a period total exists only when the days cover the period, and equals the sum of those days."""
    for key, value in found.get("getFlows", {}).items():
        payload = value["payload"]
        if payload["totals"] != flow_totals(payload["days"]):
            problems.append(f"flows example {key}: the period totals are not the covered sums of its days (null when not covered)")

