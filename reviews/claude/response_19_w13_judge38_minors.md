# Response 19: W13, judge 38's two minors, and the owner defaults' wording

Judge 38 (`exepex/trading` e1b36c1) passed W13 with two minor findings. Both are **accepted**, and the judge's own
plants are now part of the planted breaks. The orchestrator's defaults on the three questions are worded into the
contract:
- `strikes=all` stays ±10%, as signed off;
- history is kept for every contract;
- weeklies' 3 pm quotes are not recorded today.

Contract 2.4.0, additions only. The served example files of 30, 31, 33 and 34 are unchanged. `blocks-32.json` gains
one example.

## Minor 1: rules the contract states, now enforced by the schema (accepted)

**Evidence the rules hold:**
- In 32's data, 368 legs have volume 0, and all have IV, Greeks and chance null.
- `future` is set exactly on the 3 monthly expiries.

**Schema** (`api/schemas/blocks-chain.yaml`, the same if/then pattern as coverage):
- `ChainSide`: `volume: 0` ⇒ `iv`, `greeks` and `chance` are null (notes row 8, "Blank when the contract did not
  trade"). Chance is included because it comes from the leg's own IV.
- An expiry with `monthly: true` must carry a numeric `future`; a weekly's `future` is null.

**Semantic check:** `monthly` must be true exactly for the last listed expiry of its month. This is the file's own
calendar, so it allows for holiday shifts: 23 Nov 2026 is a Monday, because 24 Nov is Guru Nanak Jayanti.

Plants **G1** (volume 0 with IV kept) and **G2** (a weekly with a future) are caught by the schema. **G6** (a weekly
marked monthly, given a future so the schema passes) is caught by the semantic check.

## Minor 2: computed values cross-checked against their inputs (accepted)

**The check:** a new module, `tools/api/check_chain.py`. The chain's coverage check moved there from
`check_semantics.py`. It recomputes every computed figure the F&O tool's way:
- the range = spot ± straddle (every expiry);
- the ATM = the strike nearest spot, a tie going to the lower;
- the straddle = the ATM call plus put close;
- every leg's break-even = strike ± close;
- and on the full strike set: the put-call ratio, the call and put walls and adds, and max pain.

**New example:** `getChainRows_india_all`, 27 Oct with every strike in the file (89 rows, within 10%). The put-call
ratio, walls and max pain need every strike, so this example is what lets them be recomputed.

**Data check:** on 32's data all 7 expiries agree on every figure. I ran this on the mockup's full rows before writing
the check.

**Plants caught:** G3 (range), G4 (ATM), G5 (break-even), G7 (put-call ratio), plus a wrong straddle and a wrong max
pain. The chain's earlier plants and G8 moved into the same module. There are 16 chain plants, out of **54 planted
breaks** in all, and every one is caught.

**Limit (stated):**
- Only 27 Oct has a full-strike example, so for the other 6 expiries the put-call ratio, walls and max pain are not
  recomputed. Their range and monthly flag are.
- That is why the publisher story `TR-CHAIN-proposed` now lists this check as its acceptance test over every expiry.
  This is the judge's second option, used in addition to the first.

## The owner defaults, worded

- **Contract history:** `x-empty` now says history is kept for every contract NSE lists, and that a 404 only means a
  code NSE does not list.
- **Weeklies:** the `monthly` description says a weekly is end of day only and that its 3 pm quotes are not recorded
  today, because A4 records monthlies.
- **`strikes=all`:** unchanged (±10%), as signed off.

## Checks (this commit)

- check_contract: 82 examples, 54 planted breaks, all caught;
- check_mapping: zero gaps;
- examples --check and catalog --check: current;
- code size: within limits (`check_contract.py` 298 lines, `check_chain.py` 104 lines);
- web: typecheck, 372 tests pass and 0 fail, build passes.
