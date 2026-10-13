"""Example dates follow NSE's session calendar (W11 item 3: the 1Y series had skipped the Sunday 1 Feb 2026 Budget
session because a script walked weekdays). One copy of the calendar: design's vendored copy of exepex/trading's
(design/mockups/_platform/nse_sessions.csv, kept current by its nse_calendar.py --check).
  - every India example's as_of day is a session;
  - every daily series in an India example (a `dates` list, or `days` rows with a `date`) is the run of consecutive sessions
    from its first day to its last: no weekday holiday in it, no session (a Sunday one included) missing."""

from __future__ import annotations

import copy
import datetime as dt
import sys

import bundle

sys.path.insert(0, str(bundle.REPO / "design/mockups/_platform"))
from nse_calendar import exceptions, sessions  # noqa: E402


def daily_series(node, trail: str = ""):
    """(trail, [dates]) of every daily series in a payload: a `dates` list, or `days` rows with a `date` (events are
    dated rows too, but on any day, so they are not a series)."""
    if isinstance(node, dict):
        for key, sub in node.items():
            if key == "dates" and isinstance(sub, list):
                yield f"{trail}.dates", sub
            elif key == "days" and isinstance(sub, list) and all(isinstance(r, dict) and "date" in r for r in sub):
                yield f"{trail}.days[].date", [r["date"] for r in sub]
            else:
                yield from daily_series(sub, f"{trail}.{key}")
    elif isinstance(node, list):
        for sub in node:
            yield from daily_series(sub, trail + "[]")


def check_calendar(found: dict, problems: list[str], rows: dict | None = None) -> int:
    """Return the number of daily series checked."""
    rows = exceptions() if rows is None else rows
    checked = 0
    for op_id, values in found.items():
        for key, value in values.items():
            if value.get("market") != "india":
                continue
            day = dt.date.fromisoformat(value["as_of"][:10])
            if sessions(day, day, rows) != [day]:
                problems.append(f"{op_id}/{key}: as_of {day} is not an NSE session")
            for trail, dates in daily_series(value["payload"]):
                days = [dt.date.fromisoformat(d) for d in dates]
                checked += 1
                if days != sessions(days[0], days[-1], rows):
                    want = set(sessions(days[0], days[-1], rows))
                    problems.append(f"{op_id}/{key} {trail}: not NSE's sessions (missing {sorted(map(str, want - set(days)))[:3]}, "
                                    f"extra {sorted(map(str, set(days) - want))[:3]})")
    return checked


BREAKS = (  # label, operation, example, change: each must fail check_calendar
    ("a weekday holiday (Gandhi Jayanti, 2 Oct) in a daily series", "getChainHistory", "india",
     lambda p: p["dates"].__setitem__(p["dates"].index("2026-10-01"), "2026-10-02")),
    ("a session dropped from a daily series", "getContractHistory", "india_long", lambda p: p["dates"].pop(10)),
    ("a flows day dated on a Saturday", "getFlows", "india", lambda p: p["days"][-1].update(date="2026-10-10")),
)


def planted(found: dict, problems: list[str]) -> None:
    for label, op_id, key, change in BREAKS:
        value = copy.deepcopy(found[op_id][key])
        change(value["payload"])
        caught: list[str] = []
        check_calendar({op_id: {key: value}}, caught)
        if not caught:
            problems.append(f"planted break not caught: {label}")
