# Response 20: W11 follow-ups, answer to judge 40 (FAIL, one should-fix, two minors)

Judge 40 (`exepex/trading` 510f1d3) judged commit 6ef9fd1.

## Should-fix: the stock tool's part needed data it does not have (accepted)

**Evidence (checked, strong):** the India summary rule requires `screens.delivery` for every universe, `ours` included.
Delivery % comes from NSE's security-wise file, which exepex/trading publishes. The 52-week `high`/`low` and the
volume ratio come from NSE's rows too. The served `ours` counts were computed from 33's **NSE rows** filtered to the
20 companies. So the part I gave the stock tool could only be built from exepex/trading's data: a publisher that did
not own its inputs.

**Fix (orchestrator decision, 13 Oct 2026, after judge 40; the judge's cleanest option):**
- **The stock tool stores only `FollowedCompaniesIndia`:** `{as_of, companies: [NSE symbols]}`, closed. That list is
  the one input it truly owns. In the mockup it is the 20 companies of its published signals.
- **exepex/trading reads that list.** It tags its NSE rows `ours` and counts the `ours` universe over its own rows, so
  there is one publisher per figure and no merge.
- `ScreenerSummaryNsePart`, `ScreenerSummaryOursPart` and the route's merge are removed. The India summary is
  exepex/trading's page again.
- **The operations** (India summary and India stocks) name the list in a new `x-inputs`. The catalog's "Stored parts"
  table shows each part's role: a whole table the route pages, or an input the block's publisher reads.

**Checks** (`tools/api/check_stored.py`):
- the rows tagged `ours` in exepex/trading's stored India table must be exactly the stock tool's list;
- the served `ours` counts must equal the counts of exepex/trading's NSE rows for that list.

**Plants (6, replacing the 3 merge plants), all caught:**
- a company missing from the list;
- counts inside the list (it owns only the list);
- an NSE row tagged `ours` that the stock tool does not follow;
- the 3 table plants, kept: total not matching the row count, NSE delivery on a stored US row, a served row that is
  not the stored row.

**The label:** response 17 and the first `blocks-stored.yaml` called the split "owner decision (a)". That was
**wrong**: it was the orchestrator's decision and has no owner record. The contract now says "orchestrator decision,
13 Oct 2026 (judge 40)". Response 17 stays as written, as the record of what was claimed; this correction supersedes it.

## Minor 2: the per-leaf catalog showed `ours` leaves under exepex/trading (resolved by the fix)

In India exepex/trading now does publish them. The `ours` property no longer carries a separate catalog entry, so
India inherits exepex/trading and the US the stock tool, each from its operation.

## Minor 3: in-memory stored tables need a named acceptance check (accepted)

The publishing stories now name `tools/api/check_stored.py` as their acceptance check:
- `TR-NSE-proposed`: its stored tables and summary;
- `K5-proposed`: its stored parts, including the followed list.

## Item 3 (the 1 Feb 2026 session)

The design session's fetch-script fix landed (f72dafb). I will regenerate the examples and list every changed field
once its 33/34 rebuild commit lands, and reuse its vendored calendar (one copy).

## Checks (this commit)

- check_contract: 82 examples, 54 planted breaks, all caught;
- check_mapping: zero gaps;
- examples --check and catalog --check: current;
- code size: within limits;
- web: typecheck, 372 tests pass and 0 fail, build passes.
- Served schemas and examples: unchanged.
