"""Rules of the F&O data catalog that the examples alone cannot guard (judge 102): the fields that must stay owner-only,
and probes, each an invalid page the schema must reject. A rule deleted from a schema or a limit raised in it lets its
probe through, which fails the check (the examples stay valid either way, so they cannot catch it)."""

from __future__ import annotations

import copy
import re
from collections.abc import Callable
from pathlib import Path

from check_contract import errors
from fno_walk import response_ref, schema_nodes, screen_operations

# operationId -> leaf-path prefixes whose v4 meaning waits for G6 (judge 102 should-fix 1): each must stay x-provisional
PROVISIONAL_PATHS = {
    "getFnoForecastLab": ("payload.questions[].scores.comparisons[].p_value", "payload.questions[].scores.comparisons[].interval",
                          "payload.questions[].scores.comparisons[].verdict", "payload.questions[].scores.comparisons[].min_effect_met",
                          "payload.questions[].scores.comparisons[].futility_upper_bound", "payload.questions[].scores.n_needed",
                          "payload.questions[].today.values[].variance", "payload.questions[].settle."),
    "getFnoWeather": ("payload.scores[].",),
}
# operationId -> leaf-path prefixes that must be owner-only (live legs, entry ranges, exits, objections, the stress line)
OWNER_PATHS = {
    "getFnoCard": ("payload.trade.", "payload.advocate.objections", "payload.stress."),
    "getFnoPaperTrades": ("payload.open[].legs", "payload.open[].alerts[]"),
}
# (operationId, payload list, field, value): a value the schema allows but the page never sends (judge 217 note B)
NEVER_SENT_VALUES = (("getFnoWeather", "drivers", "driver", "us_overnight"),)


def _question(value: dict) -> dict:
    return value["payload"]["questions"][0]


def _ai(value: dict) -> dict:
    return next(f for f in value["payload"]["forecasters"] if f["isolation"] == "sealed_same_day")


def _rebuilt(value: dict) -> dict:
    return next(s for s in value["payload"]["questions"][0]["series"] if s["label"] == "backfill_exploratory")


# (what the schema must refuse, the example it starts from, the change that makes it invalid)
PROBES: tuple[tuple[str, str, Callable[[dict], None]], ...] = (
    ("a TRADE card above the Rs 10,000 cap a trade (owner, 14 Oct 2026)", "getFnoCard_india_trade",
     lambda v: v["payload"]["trade"].update(max_loss=10001)),
    ("a TRADE card in RED weather (design 4.1, owner 14 Oct)", "getFnoCard_india_trade",
     lambda v: v["payload"]["weather"].update(colour="RED")),
    ("a settle date under 60 scored outcomes (design 5.5)", "getFnoForecastLab_india_waiting",
     lambda v: _question(v)["settle"].update(status="projected", r=3.0, projected_date="2028-01-01")),
    ("an AI forecaster without the sealed-same-day label (owner, 14 Oct 2026, condition 2)", "getFnoForecastLab_india_winning",
     lambda v: _ai(v).update(isolation_label="isolated")),
    ("an AI book declared code with no isolation label (owner, 14 Oct 2026, condition 2)", "getFnoForecastLab_india_winning",
     lambda v: _ai(v).update(isolation="code", isolation_label=None)),
    ("RED weather that does not block new trades (owner, 14 Oct)", "getFnoWeather_india_red",
     lambda v: v["payload"].update(blocks_new_entries=False)),
    ("a missing weather that does not block new trades (owner, 15 Oct, \"4 A\")", "getFnoWeather_india_missing",
     lambda v: v["payload"].update(blocks_new_entries=False)),
    ("a stress line other than the three paired scenarios (design 6.2, response 113 #4)", "getFnoCard_india_trade",
     lambda v: v["payload"]["stress"]["scenarios"][2].update(vix_move_pct=50)),
    ("a fourth stress scenario", "getFnoCard_india_trade",
     lambda v: v["payload"]["stress"]["scenarios"].append(dict(v["payload"]["stress"]["scenarios"][0]))),
    ("real money eligible before the real-money gate (design 8.3)", "getFnoStrategyLab_india_passed",
     lambda v: v["payload"]["real_money"].update(eligible=True)),
    ("a page hold whose reason carries a value (judge 251: a fixed sentence, never a value)", "getFnoPageHolds_india_held",
     lambda v: v["payload"]["holds"][0].update(reason="Max loss Rs 10,500 above the cap")),
    ("a held-back card in other words than the owner's (owner, 16 Oct 2026)", "getFnoCard_india_withheld",
     lambda v: v["payload"]["withheld"].update(reason_text="Card withheld")),
    ("a rebuilt score series without its back-fill file (judge 224)", "getFnoForecastHistory_india_ahead",
     lambda v: _rebuilt(v).update(backfill_sha256=None)),
    ("a live score series naming a back-fill file (judge 224)", "getFnoForecastHistory_india_ahead",
     lambda v: v["payload"]["questions"][0]["series"][0].update(backfill_sha256=_rebuilt(v)["backfill_sha256"])),
)  # fmt: skip


def check_owner_paths(leaves: list, problems: list[str]) -> None:
    for leaf in leaves:
        for prefix in OWNER_PATHS.get(leaf.op, ()):
            if leaf.path.startswith(prefix) and leaf.visibility != "owner":
                problems.append(f"{leaf.op} {leaf.path}: must stay owner-only (live card detail), not {leaf.visibility}")


def check_provisional(leaves: list, problems: list[str]) -> None:
    for leaf in leaves:
        for prefix in PROVISIONAL_PATHS.get(leaf.op, ()):
            if leaf.path.startswith(prefix) and not leaf.provisional:
                problems.append(f"{leaf.op} {leaf.path}: its v4 meaning waits for G6, so it must stay x-provisional")


def check_probes(doc: dict, problems: list[str]) -> None:
    refs = {name: response_ref(op) for _, op in screen_operations(doc) for name in _names(op)}
    for what, name, change in PROBES:
        value = copy.deepcopy(doc["components"]["examples"][name]["value"])
        try:
            change(value)
        except (KeyError, IndexError, StopIteration) as missing:  # the example lost what the probe changes (judge 224)
            problems.append(f"probe on {name} cannot plant {what}: its example lacks the part it changes ({missing!r})")
            continue
        if not errors(doc, refs[name], value):
            problems.append(f"the schema lets through {what} (probe on {name})")


def _names(op: dict) -> list[str]:
    examples = op["responses"]["200"]["content"]["application/json"].get("examples", {})
    return [ref["$ref"].rsplit("/", 1)[1] for ref in examples.values()]


def check_never_sent_values(doc: dict, problems: list[str]) -> None:
    ops = {op["operationId"]: op for _, op in screen_operations(doc)}
    for op_id, key, field, value in NEVER_SENT_VALUES:
        for name in _names(ops[op_id]):
            rows = doc["components"]["examples"][name]["value"]["payload"].get(key) or []
            if any(row[field] == value for row in rows):
                problems.append(f"example {name}: {key}[].{field} is {value}, which is never sent")


def check_stress(doc: dict, problems: list[str]) -> None:
    """The stress line can never exceed the sum of the open positions' maximum losses (design 6.2)."""
    for _, op in screen_operations(doc):
        for name in _names(op):
            stress = doc["components"]["examples"][name]["value"]["payload"].get("stress")
            if stress and any(s["loss"] > stress["max_loss_sum"] for s in stress["scenarios"]):
                problems.append(f"example {name}: a stress line exceeds the sum of maximum losses")


def config_figures(schemas: dict, examples: dict) -> set[str]:
    """The owner's config figures the contract sends (fields whose catalog source is the config), as a screen would
    write them: 10000, 10,000 (Western) and 1,50,000 (Indian). Only 1,000 and up: small shares (50, 80) are too common
    in code to search for safely."""
    keys = set()
    for name, schema in schemas.items():
        for _, node in schema_nodes(schema, name):
            for key, sub in node.get("properties", {}).items():
                source = str((sub.get("x-catalog") or {}).get("source", "")) if isinstance(sub, dict) else ""
                if "config" in source:
                    keys.add(key)
    values = {int(v) for v in _values(examples, keys) if isinstance(v, (int, float)) and v >= 1000 and v == int(v)}
    return {form for v in values for form in (str(v), f"{v:,}", _indian(v))}


def check_copied_figures(figures: set[str], mockups: Path, folders: list[str], problems: list[str]) -> None:
    """No catalog mockup writes a config figure into its own code: it reads the field (judge 233)."""
    pattern = re.compile(r"(?<![\d,.])(" + "|".join(sorted(map(re.escape, figures), key=len, reverse=True)) + r")(?![\d,])") if figures else None
    for folder in folders:
        for script in sorted((mockups / folder / "js").glob("*.js")):
            for number, line in enumerate(script.read_text(encoding="utf-8").splitlines(), start=1):
                if pattern and pattern.search(line):
                    problems.append(f"{folder}/js/{script.name}:{number}: writes the config figure {pattern.search(line).group(1)}; read the contract field instead")


def _values(node, keys: set[str]):
    if isinstance(node, dict):
        for key, sub in node.items():
            if key in keys and not isinstance(sub, (dict, list)):
                yield sub
            yield from _values(sub, keys)
    elif isinstance(node, list):
        for sub in node:
            yield from _values(sub, keys)


def _indian(value: int) -> str:
    head, tail = str(value)[:-3], str(value)[-3:]
    groups = [head[max(0, i - 2):i] for i in range(len(head), 0, -2)][::-1]
    return ",".join(groups + [tail]) if head else tail
