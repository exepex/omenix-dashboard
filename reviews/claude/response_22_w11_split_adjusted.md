# Response 22: W11, judge 42's should-fixes for unadjusted prices (contract side)

Judge 42 (`exepex/trading` reviews/judge) passed item 3 and confirmed my KOTAKBANK finding from NSE's own closes:
- 2,152.10 on 13 Oct 2025;
- 356.05 on 1 Apr 2026;
- 443.40 on 12 Oct 2026.

That is a 5:1 split, so the true 1Y change is about +3 %, not the −79.15 % in the served example. Its four "expected"
points are accepted: 1 to 3 here, and 4 once the design session's 33 rebuild lands.

## 1. The contract states the rule (accepted)

- **`PeriodChange`** (d1, w1, m1, m3, y1 on screener rows and on Markets quotes): the past close is adjusted for every
  split and bonus since, using NSE's corporate-actions file in India and the stock tool's adjusted prices in the US.
  The description adds: "so a 5:1 split is not a −80 % year".
- **`ScreenerStock`:** every figure built on past closes (d1 to y1, the 52-week `h` and `l`, the RSI) uses adjusted
  closes, "as the company contract's bars do (company.yaml)". `p` and `v` are the day's own close and volume, which no
  later action changes.
- **`OverviewQuote`:** changes, the 52-week range and `closes` are adjusted as of `as_of`. Index levels need no
  adjustment, because an index is never split.
- **The catalog:** every such field's source now reads "computed: ours, from the daily closes adjusted for splits and
  bonuses as of the close", so `catalog.md` shows the rule on each field.
- These are wording only: no type, field or example changed.

## 2. The publisher is guarded (accepted)

`TR-NSE-proposed` (the story the P6 builder implements) now requires:
- adjustment from NSE's corporate-actions file before any period change, 52-week range, RSI or 1Y series is
  computed;
- as an acceptance case, KOTAKBANK's 1Y change on 12 Oct 2026 is about +3 % (5:1 split; NSE closes 2,152.10 and
  443.40), not −79 %.

## 3. No heuristic (accepted)

No "high above 3 × price" check was added. The 88-row pattern in response 21 was only how I found the problem. As the
judge says, a real crash would trip such a rule and a small split would pass it.

## The `adjusted` flag the orchestrator mentioned: not added (disagreement, with the reason)

`company.yaml` carries `adjusted` per stored bar. I did not add a per-row flag to the screener or Markets rows, for
two reasons:
- **It would fail the contract's own rule** (strong evidence: `check_mapping.py`). Every field must serve an element of
  the frozen notes, and no element of 33 or 34 shows "adjusted". Adding one would change a frozen screen.
- **It is not needed for the guard.** A row whose figures are adjusted is correct whether or not an action happened.
  What protects the owner is the definition, stated above, plus the publisher's acceptance test.

If the owner wants the screen to show "adjusted for a 5:1 split", that is a new element in 33 (a design change and a
`changes.md` entry), and then the flag can serve it.

**Question:** does the owner want that marker on the screener?

## 4. Examples (pending)

Once the design session's 33 rebuild with adjusted closes lands, I regenerate the examples and list every changed
value, as in response 21.

## Checks (this commit)

- check_contract and check_mapping pass;
- examples are current (unchanged);
- the catalog is re-rendered and current;
- code size: within limits;
- web: typecheck, 372 tests pass and 0 fail, build passes.
