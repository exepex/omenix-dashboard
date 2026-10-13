"""Story W10 criteria 3-5 on the bundled contract (api/), plus planted-failure tests that prove the rules bite.

  3. The bundle is a valid OpenAPI 3.1 document; every block operation has India (and US) examples generated from the
     mockups' data (tools/api/examples.py --check); every example validates against its response schema; every block
     schema is reached by at least one example value.
  4. Every endpoint field resolves publisher, source, unit, freshness, story and status; the story is listed in
     api/catalog/stories.yaml; a payload field's publisher is its endpoint's publisher.
  5. Screen rules: every object with a price requires `as_of`; no F&O field in a market-scoped endpoint and every
     F&O endpoint under /markets/india/fno; India-only fields are absent from US examples and rejected in the US;
     the market's own currency is enforced; the only sums are the owner's per-group totals and single-account figures.
Usage: pip install -r tools/api/requirements.txt; python3 tools/api/check_contract.py. Exit 1 on any problem."""

from __future__ import annotations

import copy
import re
import sys
from datetime import date, datetime
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle  # noqa: E402
import examples  # noqa: E402
from check_semantics import check_flows, check_home_events, check_views  # noqa: E402
from walk import CATALOG_KEYS, block_fields, block_operations, resolve  # noqa: E402

URN = "urn:omenix:api"
PLANTED = 32  # planted breaks in planted()
STATUSES = {"published", "planned"}
AGGREGATES = {"group_total": "GroupTotal", "single_account": None}
BLOCK_FILE = "blocks-"


def formats() -> FormatChecker:
    checker = FormatChecker([])
    checker.checks("date-time")(lambda v: not isinstance(v, str) or bool(datetime.fromisoformat(v.replace("Z", "+00:00"))))
    checker.checks("date")(lambda v: not isinstance(v, str) or bool(date.fromisoformat(v)))
    return checker


def validator(doc: dict, ref: str) -> Draft202012Validator:
    registry = Registry().with_resource(URN, Resource.from_contents(doc, default_specification=DRAFT202012))
    return Draft202012Validator({"$ref": f"{URN}{ref}"}, registry=registry, format_checker=formats())


def errors(doc: dict, ref: str, value) -> list[str]:
    return [f"{'/'.join(map(str, e.absolute_path)) or '<root>'}: {e.message[:160]}" for e in validator(doc, ref).iter_errors(value)]


def reached(doc: dict, schema: dict, value, hits: set, depth: int = 0) -> None:
    """Record the named schemas a value instantiates (non-null), following $ref, properties, items, allOf, oneOf."""
    if depth > 40 or value is None:
        return
    if "$ref" in schema:
        name = schema["$ref"].rsplit("/", 1)[1]
        hits.add(name)
        reached(doc, resolve(doc, schema["$ref"]), value, hits, depth + 1)
    for part in schema.get("allOf", []):
        reached(doc, part, value, hits, depth + 1)
    for part in schema.get("oneOf", []):
        if "$ref" in part and not errors(doc, part["$ref"], value):
            reached(doc, part, value, hits, depth + 1)
    if isinstance(value, dict):
        for key, sub in (schema.get("properties") or {}).items():
            if key in value:
                reached(doc, sub, value[key], hits, depth + 1)
        extra = schema.get("additionalProperties")
        if isinstance(extra, dict):
            for key, sub in value.items():
                if key not in (schema.get("properties") or {}):
                    reached(doc, extra, sub, hits, depth + 1)
    if isinstance(value, list) and isinstance(schema.get("items"), dict):
        for sub in value:
            reached(doc, schema["items"], sub, hits, depth + 1)


def check_openapi(doc: dict, problems: list[str]) -> None:
    try:
        from openapi_spec_validator import validate
    except ImportError:
        problems.append("openapi-spec-validator is not installed (pip install -r tools/api/requirements.txt)")
        return
    try:
        validate(doc)
    except Exception as error:  # the validator's own error types; report and fail
        problems.append(f"OpenAPI validation: {str(error)[:400]}")


def check_examples(doc: dict, problems: list[str]) -> dict:
    """Validate every block example; return {operationId: {market key: value}}."""
    found, used = {}, set()
    for path, _, op in block_operations(doc):
        content = op["responses"]["200"]["content"]["application/json"]
        refs = content.get("examples", {})
        if not refs:
            problems.append(f"{path}: no example")
        for key, ref in refs.items():
            name = ref["$ref"].rsplit("/", 1)[1]
            used.add(name)
            value = doc["components"]["examples"][name]["value"]
            found.setdefault(op["operationId"], {})[key] = value
            problems += [f"example {name}: {e}" for e in errors(doc, content["schema"]["$ref"], value)]
        markets = {v["market"] for v in found.get(op["operationId"], {}).values()}
        want = ({"india"} if "/markets/india/" in path else {"us"} if "/markets/us/" in path
                else {"india", "us"} if "{market}" in path else {"_all"})
        if markets != want:
            problems.append(f"{path}: examples cover {sorted(markets)}, want {sorted(want)}")
    unused = {n for n in doc["components"].get("examples", {}) if n.split("_")[0] in {op["operationId"] for _, _, op in block_operations(doc)}} - used
    problems += [f"example {n} is not referenced by its operation" for n in sorted(unused)]
    return found


def check_coverage(doc: dict, found: dict, problems: list[str]) -> int:
    hits: set = set()
    for path, _, op in block_operations(doc):
        schema = op["responses"]["200"]["content"]["application/json"]["schema"]
        for value in found.get(op["operationId"], {}).values():
            reached(doc, schema, value, hits)
    names = [n for n, f in bundle.schema_files().items() if f.startswith(BLOCK_FILE)]
    rules = {"MarketCurrency", "UsMarket", "IndiaMarket"}  # constraint schemas, no payload of their own
    missing = [n for n in names if n not in hits and n not in rules and not n.endswith("Rule")]
    problems += [f"block schema {n} has no example value" for n in missing]
    return len(names)


def check_catalog(doc: dict, problems: list[str]) -> int:
    stories = yaml.safe_load((bundle.API / "catalog/stories.yaml").read_text(encoding="utf-8"))
    publisher = {op["operationId"]: op["x-publisher"] for _, _, op in block_operations(doc)}
    leaves = [f for f in block_fields(doc) if f.leaf]
    for f in leaves:
        where = f"{f.op} {f.path}"
        missing = [k for k in CATALOG_KEYS if not f.catalog.get(k)] + ([] if f.unit else ["unit"])
        if missing:
            problems.append(f"{where}: catalog lacks {missing}")
        if f.catalog.get("story") and f.catalog["story"] not in stories:
            problems.append(f"{where}: story {f.catalog['story']} is not in stories.yaml")
        if f.catalog.get("status") not in STATUSES:
            problems.append(f"{where}: status {f.catalog.get('status')!r} not in {sorted(STATUSES)}")
        if f.path.startswith("payload") and f.catalog.get("publisher") != publisher[f.op]:
            problems.append(f"{where}: publisher {f.catalog.get('publisher')} differs from its endpoint's {publisher[f.op]}")
    return len(leaves)


def check_rules(doc: dict, found: dict, problems: list[str]) -> None:
    # as-of on every price: an object with an x-price property requires as_of, or names (x-as-of-from) the page
    # schema whose required as_of covers all its rows (a table of one day's closes)
    schemas = doc["components"]["schemas"]
    for name, f in bundle.schema_files().items():
        if not f.startswith(BLOCK_FILE):
            continue
        for trail, node in walk_nodes(schemas[name], name):
            props = node.get("properties") or {}
            if not any(isinstance(p, dict) and p.get("x-price") for p in props.values()) or "as_of" in node.get("required", []):
                continue
            page = schemas.get(node.get("x-as-of-from", ""), {})
            if "as_of" not in page.get("required", []):
                problems.append(f"{trail}: has a price but does not require as_of (nor names a page that does)")
    fields = block_fields(doc)
    for path, _, op in block_operations(doc):
        pub, fno_path = op["x-publisher"], path.startswith("/api/v1/markets/india/fno/")
        # exepex/trading publishes India only: its F&O blocks under /markets/india/fno/, its NSE stock and index blocks
        # under /markets/india/ (owner, 13 Oct 2026); nothing else may live under /markets/india/fno/
        if fno_path and pub != "fno":
            problems.append(f"{path}: only exepex/trading's F&O blocks live under /api/v1/markets/india/fno/")
        if pub == "fno" and not path.startswith("/api/v1/markets/india/"):
            problems.append(f"{path}: an exepex/trading block is India only (/api/v1/markets/india/)")
    problems += [f"{f.op} {f.path}: F&O field in a market-scoped endpoint" for f in fields
                 if f.catalog.get("publisher") == "fno" and f.path.startswith("payload") and f.op not in
                 {op["operationId"] for _, _, op in block_operations(doc) if op["x-publisher"] == "fno"}]
    for f in fields:
        if f.aggregate and f.aggregate not in AGGREGATES:
            problems.append(f"{f.op} {f.path}: x-aggregate {f.aggregate} is not an allowed sum")
        if f.aggregate == "group_total" and "/GroupTotal/" not in f.pointer:
            problems.append(f"{f.op} {f.path}: a group total outside GroupTotal")
    # US examples: no F&O value anywhere; planted failures must be rejected
    for op_id, values in found.items():
        for key, value in values.items():
            if value["market"] == "us":
                text = yaml.safe_dump(value)
                for word in ("snap3pm", "eod", "fno_expiry", "weekly_expiry", "future", "option", "open_structures", "at_risk", "F&O"):
                    if re.search(rf"(?<![\w&]){re.escape(word)}(?![\w&])", text):
                        problems.append(f"US example {op_id}/{key} mentions {word!r}")
    planted(doc, found, problems)


def walk_nodes(node, trail):
    if isinstance(node, dict):
        yield trail, node
        for key, sub in node.items():
            yield from walk_nodes(sub, f"{trail}/{key}")
    elif isinstance(node, list):
        for i, sub in enumerate(node):
            yield from walk_nodes(sub, f"{trail}/{i}")


def planted(doc: dict, found: dict, problems: list[str]) -> None:
    """Each planted break must make validation fail; a pass means the rule does not bite."""
    def must_fail(label, op_id, key, change):
        value = copy.deepcopy(found[op_id][key])
        change(value)
        ref = next(op for _, _, op in block_operations(doc) if op["operationId"] == op_id)["responses"]["200"]["content"]["application/json"]["schema"]["$ref"]
        if not errors(doc, ref, value):
            problems.append(f"planted break not caught: {label}")
    must_fail("open_structures in the US account", "getAccounts", "us", lambda v: v["payload"]["accounts"]["manual"].update(open_structures=0))
    must_fail("at_risk in the US account", "getAccounts", "us", lambda v: v["payload"]["accounts"]["manual"].update(at_risk=0))
    must_fail("India account without its F&O figures", "getAccounts", "india", lambda v: v["payload"]["accounts"]["manual"].pop("at_risk"))
    must_fail("snap3pm source in the US", "getPriceSources", "us", lambda v: v["payload"]["sources"].update(snap3pm=v["payload"]["sources"]["close"]))
    must_fail("F&O expiry in the US calendar", "getEvents", "us", lambda v: v["payload"]["events"][0].update(kind="fno_expiry"))
    must_fail("USD in India", "getPositions", "india", lambda v: v["payload"].update(currency="USD"))
    must_fail("INR in the US", "getGroups", "us", lambda v: v["payload"].update(currency="INR"))
    must_fail("a price without as_of", "getIndices", "india", lambda v: v["payload"]["indices"][0].pop("as_of"))
    must_fail("a position without as_of", "getPositions", "india", lambda v: v["payload"]["own"][0].pop("as_of"))
    must_fail("an F&O row for the US market", "getFnoBooks", "india", lambda v: v.update(market="us"))
    must_fail("a stock pick from the hybrid family", "getPicks", "india", lambda v: v["payload"]["signals"][0].update(family="hybrid"))
    must_fail("a future in stock search", "searchInstruments", "india", lambda v: v["payload"]["instruments"][0].update(kind="future"))
    must_fail("a block without the Paper label", "getSession", "us", lambda v: v.pop("paper"))
    # W11: the screener and the Markets overview
    must_fail("an F&O universe in the US screener", "getScreenerSummaryUs", "us", lambda v: v["payload"]["universes"].update(fno=v["payload"]["universes"]["ours"]))
    must_fail("an F&O tag on a US screener row", "getScreenerStocksUs", "us", lambda v: v["payload"]["rows"][0].update(u=["fno"]))
    must_fail("India's screener without its F&O universe", "getScreenerSummaryIndia", "india", lambda v: v["payload"]["universes"].pop("fno"))
    must_fail("India's flows served for the US", "getFlows", "india", lambda v: v.update(market="us"))
    must_fail("an NSE block served for the US", "getIndiaSectors", "india", lambda v: v.update(market="us"))
    must_fail("screener rows without the page's as_of", "getScreenerStocksIndia", "india", lambda v: v["payload"].pop("as_of"))
    must_fail("a quote without as_of", "getWorld", "us", lambda v: v["payload"]["quotes"][0].pop("as_of"))
    # round 2 (judge 27, finding 2): every US payload is closed, so no F&O or India-only field can ride along
    must_fail("F&O fields on a US screener row (J1)", "getScreenerStocksUs", "us", lambda v: v["payload"]["rows"][0].update(fut=1.0, oi=1, b="long_buildup", lot=1))
    must_fail("NSE delivery on a US screener row (J2)", "getScreenerStocksUs", "us", lambda v: v["payload"]["rows"][0].update(dl=50.0))
    must_fail("an F&O count block in the US summary (J5)", "getScreenerSummaryUs", "us", lambda v: v["payload"].update(fno={"n": 1}))
    must_fail("a delivery count in the US summary", "getScreenerSummaryUs", "us", lambda v: v["payload"]["universes"]["ours"]["screens"].update(delivery=0))
    must_fail("an India row without its delivery figure", "getScreenerStocksIndia", "india", lambda v: v["payload"]["rows"][0].pop("dl"))
    must_fail("an F&O field on an F&O row's sibling: a stock row with IV", "getScreenerStocksIndia", "india", lambda v: v["payload"]["rows"][0].update(iv=12.0))
    must_fail("a currency on a world quote (J9)", "getWorld", "india", lambda v: v["payload"]["quotes"][0].update(currency="INR"))
    must_fail("an RBI decision in the US calendar (J7)", "getEvents", "us", lambda v: v["payload"]["events"][0].update(kind="rbi_policy"))
    # finding 3: a 1M total computed from 5 days (schema: a total with complete false; the semantic check: days)
    must_fail("a 1M flows total marked incomplete but with a number", "getFlows", "india", lambda v: v["payload"]["totals"]["m1"].update(fii=-4699.14))
    fake = copy.deepcopy(found["getFlows"]["india"])
    fake["payload"]["totals"]["m1"].update(complete=True, fii=sum(d["fii"]["net"] for d in fake["payload"]["days"]), dii=0.0)
    caught: list[str] = []
    check_flows({"getFlows": {"planted": fake}}, caught)
    if not caught:
        problems.append("planted break not caught: a 1M flows total computed from 5 days")
    # finding 1: the Markets view loses the US CPI that Home's view shows on the same date
    broken = copy.deepcopy(doc)
    rows = broken["components"]["examples"]["getEvents_us_markets"]["value"]["payload"]["events"]
    rows[:] = [e for e in rows if e["kind"] != "cpi"]
    caught = []
    check_views(broken, caught)
    if not caught:
        problems.append("planted break not caught: the two screens' calendars disagree")
    # judge 32: Home's query without market_first (the plain 6 nearest) changes the signed-off Home
    from examples_screens import view
    nearest = copy.deepcopy(doc)
    exs = nearest["components"]["examples"]
    for name in ("getEvents_india", "getEvents_india_home20"):
        query = {**exs[name]["x-query"], "market_first": False}
        exs[name]["value"]["payload"]["events"] = view(exs["getEvents_india_calendar"]["value"]["payload"]["events"], query)
    caught = []
    check_home_events(nearest, caught)
    if len(caught) < 2:
        problems.append("planted break not caught: Home's plain 6 nearest (signed-off list and real calendar)")


def main() -> int:
    problems: list[str] = []
    doc = bundle.bundle()
    check_openapi(doc, problems)
    if not examples.is_current():
        problems.append("api/examples/blocks.json is not what the mockups' data gives (run python3 tools/api/examples.py)")
    found = check_examples(doc, problems)
    schemas = check_coverage(doc, found, problems)
    leaves = check_catalog(doc, problems)
    check_rules(doc, found, problems)
    check_flows(found, problems)
    check_views(doc, problems)
    check_home_events(doc, problems)
    ops = list(block_operations(doc))
    print(f"contract: {len(doc['paths'])} paths ({len(ops)} block endpoints), {sum(len(v) for v in found.values())} block examples, "
          f"{schemas} block schemas, {leaves} catalogued leaf fields, {PLANTED} planted breaks")
    print("\n".join(problems) if problems else "contract: OpenAPI 3.1 valid; examples valid and current; catalog complete; screen rules hold; every planted break caught")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
