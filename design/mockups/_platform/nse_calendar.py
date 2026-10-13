"""NSE's trading sessions for the mockups' fetch scripts: a vendored copy of exepex/trading's calendar
(research/data/calendar/nse_sessions.csv, built from NSE's own circulars) and its rule, so no script walks weekdays.

The file lists only the exceptions to "every weekday is a session": weekday holidays (`holiday`), weekend live sessions
(`special`, e.g. the Sunday 1 Feb 2026 Budget session) and Diwali muhurat sessions (`muhurat`, a session whatever the
day). The same rule as exepex/trading fno/research_data/calendar.py.

    from nse_calendar import sessions                  # design/mockups/_platform on sys.path
    for day in sessions(first, last): ...

    python design/mockups/_platform/nse_calendar.py --check <clone of exepex/trading>   (exit 1 when the copy differs)
"""
from __future__ import annotations

import csv
import datetime as dt
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CALENDAR = os.path.join(HERE, "nse_sessions.csv")
SOURCE = os.path.join("research", "data", "calendar", "nse_sessions.csv")
SESSION_KINDS = ("special", "muhurat")


def exceptions(path: str = CALENDAR) -> dict:
    with open(path, encoding="utf-8") as handle:
        return {dt.date.fromisoformat(r["date"]): r["kind"] for r in csv.DictReader(handle)}


def covered(rows: dict, day: dt.date) -> bool:
    years = {d.year for d in rows}
    return min(years) <= day.year <= max(years)


def sessions(first: dt.date, last: dt.date, rows: dict | None = None) -> list:
    """Every NSE session from first to last, both included; a day outside the calendar's years raises."""
    rows = exceptions() if rows is None else rows
    out, day = [], first
    while day <= last:
        if not covered(rows, day):
            raise ValueError(f"{day} is outside the NSE calendar: refresh the copy from exepex/trading ({SOURCE})")
        kind = rows.get(day)
        if kind in SESSION_KINDS or (day.weekday() < 5 and kind != "holiday"):
            out.append(day)
        day += dt.timedelta(days=1)
    return out


def check(trading_clone: str) -> bool:
    with open(CALENDAR, "rb") as mine, open(os.path.join(trading_clone, SOURCE), "rb") as theirs:
        return mine.read() == theirs.read()


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] != "--check":
        sys.exit("usage: python design/mockups/_platform/nse_calendar.py --check <clone of exepex/trading>")
    same = check(sys.argv[2])
    print("NSE calendar copy is current" if same else f"NSE calendar copy differs from {SOURCE}: copy it again")
    sys.exit(0 if same else 1)
