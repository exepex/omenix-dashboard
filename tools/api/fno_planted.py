"""Planted breaks of the F&O data catalog's rules (check_fno_screens.py): each one must be caught by the problem it
names, so a rule that stops biting fails the check."""

from __future__ import annotations

import copy

PLANTED = 16


def _example(doc: dict, name: str) -> dict:
    return doc["components"]["examples"][name]


def _payload(doc: dict, name: str) -> dict:
    return _example(doc, name)["value"]["payload"]


def _schema(doc: dict, name: str) -> dict:
    return doc["components"]["schemas"][name]


def _plants():
    """(what is broken, how, the words its problem must contain)."""
    card, weather, lab = "getFnoCard_india_trade", "getFnoWeather_india_red", "getFnoStrategyLab_india_none"
    yield "extra field", lambda d: _payload(d, card).update(extra_field=1), "Additional properties"
    yield "missing field", lambda d: _payload(d, weather).pop("drivers"), "'drivers' is a required property"
    yield "RED without the block", lambda d: _payload(d, weather).update(blocks_new_entries=False), "True was expected"
    yield "NO TRADE without a reason", lambda d: _payload(d, "getFnoCard_india_red").update(reason=None), "is not of type 'string'"
    yield "real money eligible", lambda d: _payload(d, lab)["real_money"].update(eligible=True), "False was expected"
    yield "label not Mock", lambda d: _example(d, card).update(summary="TRADE card"), "must start with Mock"
    yield "stale hash", lambda d: _payload(d, lab)["headline"].update(text="changed"), "payload_sha256 is not"
    yield "no empty case", lambda d: _example(d, "getFnoPaperTrades_india_none").update({"x-case": "positive"}), "miss the case(s) ['empty']"
    yield "money without Paper", lambda d: _schema(d, "FnoCardTrade")["properties"].update(max_loss={"type": "number", "x-unit": "INR", "description": "x"}), "must say Paper"
    yield "built without a record", lambda d: _schema(d, "FnoStrategyResult")["properties"]["gross"].pop("x-record"), "names its backend record"
    yield "unknown record", lambda d: _schema(d, "FnoStrategyResult")["properties"]["gross"].update({"x-record": "nowhere:gross"}), "unknown record"
    yield "no visibility", lambda d: _schema(d, "FnoPaperTrades").pop("x-visibility"), "x-visibility must be"
    yield "private key", lambda d: _payload(d, card)["trade"].update(entry_rule="x"), "reads like a strategy internal"
    yield "card not PAPER ONLY", lambda d: _schema(d, "FnoCard")["properties"]["label"].update(const="PAPER"), "must be the constant PAPER ONLY"
    yield "mockup drift", lambda d: _payload(d, "getFnoWeather_india_green").update(p_big_1d=0.031), "differ from the catalog"
    yield "nothing never-sent", lambda d: _schema(d, "FnoWeather").pop("x-never-sent"), "x-never-sent must list"


def planted(doc: dict, own: dict, check) -> int:
    """How many plants raise a new problem naming their break (a problem the intact contract already has does not count)."""
    baseline: list[str] = []
    check(doc, own, baseline)
    caught = 0
    for _, plant, words in _plants():
        broken = copy.deepcopy(doc)
        plant(broken)
        problems: list[str] = []
        check(broken, own, problems)
        caught += any(words in problem for problem in set(problems) - set(baseline))
    return caught
