"""Payload of the Forecast contest mockup (design/mockups/37-forecasts; slice 2 of exepex/trading docs/BUILD_MAP.md).

Every field is one that stories G1-G5 define or produce (exepex/trading research/forecasts/PROTOCOL.md, draft version 1;
docs/stories/G-forecasts.md). Fields G4's report does not define yet are listed in 37-forecasts/notes.md as the
"proposed contract". Three states, as BUILD_MAP rule 2 says: the REAL state today (empty: no forecast exists, with the
reason and what each step waits for) and two labelled EXAMPLE states made by forecast_example.py from synthetic
numbers (never from real NIFTY outcomes: the protocol's access attestation forbids looking at outcomes before the freeze).
"""
from __future__ import annotations

import datetime as dt

from forecast_example import example
from nse_calendar import exceptions, sessions

AS_OF = "2026-10-13"
QUESTIONS = [
    {"id": "q1_nifty_up_20d", "short": "NIFTY higher", "days": 20,
     "plain": "Will NIFTY close higher in 20 trading days (about a month) than today?",
     "yes_when": "NIFTY’s close 20 trading days later is above today’s close.", "yardsticks": ["baseline_a", "baseline_b"]},
    {"id": "q2_nifty_move_3pct_20d", "short": "Big NIFTY move", "days": 20,
     "plain": "Will NIFTY move 3% or more, up or down, in 20 trading days?",
     "yes_when": "NIFTY’s close 20 trading days later is at least 3% away from today’s, either way.", "yardsticks": ["baseline_a", "baseline_b"]},
    {"id": "q3_rv20_above_trailing", "short": "Bumpier month", "days": 20,
     "plain": "Will NIFTY swing more in the next 20 trading days than in the last 20?",
     "yes_when": "NIFTY’s day-to-day swings over the next 20 trading days are bigger than over the last 20.", "yardsticks": ["baseline_b", "baseline_c"]},
    {"id": "q4_vix_up_10d", "short": "Fear gauge up", "days": 10,
     "plain": "Will India VIX, the market’s fear gauge, be higher in 10 trading days than today?",
     "yes_when": "India VIX’s close 10 trading days later is above today’s close.", "yardsticks": ["baseline_b", "baseline_c"]},
    {"id": "q5_rv20_below_atm_iv30", "short": "Calmer than priced", "days": 20,
     "plain": "Will NIFTY swing less in the next 20 trading days than option prices expect today?",
     "yes_when": "NIFTY’s swings over the next 20 trading days are smaller than the swing today’s 30-day option prices imply.",
     "yardsticks": ["baseline_b", "baseline_c"]},
]
FAMILIES = [
    {"id": "book1_rules", "name": "Rule-based", "ap": "rule"},
    {"id": "book2_hybrid", "name": "Hybrid", "ap": "hybrid"},
    {"id": "book3_ai", "name": "AI team", "ap": "ai"},
]
YARDSTICKS = [
    {"id": "baseline_a", "name": "What option prices say", "only": "Questions 1 and 2",
     "plain": "The chance hidden in today’s NIFTY option prices. Option prices include a premium for risk, so this is "
              "the market’s price, not a true real-world chance.", "label": "risk-neutral"},
    {"id": "baseline_b", "name": "How often it happened", "only": "All five questions",
     "plain": "The share of the last 750 trading days (about 3 years) on which the answer was yes."},
    {"id": "baseline_c", "name": "A simple formula", "only": "Questions 3, 4 and 5",
     "plain": "A small textbook formula on recent swings (or on the fear gauge), refitted once a month."},
]
STEPS = [   # what the first real score waits for, in order (exepex/trading docs/BUILD_MAP.md slice 2, 13 Oct 2026)
    {"story": "G1", "what": "The contest’s rules are written and frozen", "status": "review",
     "detail": "Draft written; waiting for the outside review, then frozen so no rule can change after a score exists."},
    {"story": "G2", "what": "The three yardsticks are built", "status": "not_started", "detail": "Starts when G1 is frozen."},
    {"story": "G3", "what": "Rule-based makes its five forecasts every trading day", "status": "not_started",
     "detail": "Starts with G2. Each forecast is saved before 15:00 IST and can never be changed."},
    {"story": "G4", "what": "Each forecast is scored when its answer is known", "status": "not_started",
     "detail": "10 trading days later for the fear-gauge question, 20 for the other four."},
    {"story": "G5", "what": "Hybrid and AI team join the contest", "status": "not_started",
     "detail": "Comes with their own daily sessions (story F1); until then they show as not running, never as zero."},
]


def trading_days_after(first: dt.date, n: int) -> dt.date:
    """The n-th trading day after `first` (protocol section 2: NSE sessions, muhurat sessions left out)."""
    rows = exceptions()
    days = [d for d in sessions(first, first + dt.timedelta(days=2 * n), rows) if rows.get(d) != "muhurat"]
    return days[days.index(first) + n]


def first_scores(first: str) -> dict:
    d = dt.date.fromisoformat(first)
    return {"first_forecast": first, "q4": trading_days_after(d, 10).isoformat(), "others": trading_days_after(d, 20).isoformat()}


def real_state() -> dict:
    return {"kind": "real", "as_of": AS_OF, "day": None, "protocol": {"version": "1", "status": "draft_awaiting_review", "frozen_commit": None},
            "reason": "No forecast exists yet, so none can be scored. The contest’s rules wait for an outside review before "
                      "they are frozen; the yardsticks and Rule-based’s daily forecasts are built after that.",
            "steps": STEPS, "first_forecast": None, "first_score_rule": {"q4_vix_up_10d": 10, "others": 20},
            "review": {"reached": False, "date": None},
            "forecasters": {f["id"]: {"status": "not_started", "days": 0, "with_forecast": 0} for f in FAMILIES + YARDSTICKS},
            "questions": {}}


def forecast_payload() -> dict:
    return {"questions": QUESTIONS, "families": FAMILIES, "yardsticks": YARDSTICKS,
            "rules": {"min_dates": 40, "block_days": 20, "comparisons": 45, "family_wise_error": 0.05,
                      "review": "the first scheduled review, after 6 months of the three families paper trading together"},
            "standing": "Profit decides which family trades. Forecast scores only show who reads the market best; a "
                        "family never gets to trade because it forecasts well.",
            "states": {"real": real_state(),
                       "start": {**real_state(), "kind": "example", "example": "start", "first_forecast": first_scores("2026-11-02")},
                       "early": example("early", QUESTIONS, FAMILIES, YARDSTICKS),
                       "review": example("review", QUESTIONS, FAMILIES, YARDSTICKS)}}
