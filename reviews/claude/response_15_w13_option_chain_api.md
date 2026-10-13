# Response 15: story W13, the API contract and data catalog for the option chain (32-option-chain)

Story W13 (`exepex/trading` `docs/stories/X-cross-repository.md`) asks for the signed-off option chain
(`design/mockups/32-option-chain`, frozen as of 9d9c401) what W10 and W11 did for 30, 31, 33 and 34:
- small independent block endpoints;
- validated examples from its `data.json`;
- catalog rows with publisher `exepex/trading`;
- India only.

Acceptance is W11's criteria 1-6 applied to 32. Contract version 2.3.0; **additions only**.

## The six endpoints (all `GET`, India only, publisher `fno`, not published yet: story `TR-CHAIN-proposed`)

| Path under `/api/v1/markets/india/fno/chain/` | Payload | Feeds (notes.md rows) |
|---|---|---|
| `underlying` | NIFTY `spot`, `chg`, `chg_pct`, India `vix`, `as_of` | header (1), NIFTY card (2), mood (5) |
| `expiries` | each expiry: `days`, `monthly`, `future` (null for a weekly), `stats` (straddle, range, walls, adds, max pain, pcr, ATM, ATM IV) | expiry chips (7), range (3), positions (4), mood (5), chain ATM (8) |
| `rows?expiry=&strikes=near\|band\|all` | `lot`, then per strike the call and put: close, change, OI, OI change, volume, IV, Greeks (null when not traded), break-even, chance | chain Simple, Detailed, Greeks, Strikes (8), tray (9), OI chart (10), IV chart (11), contract view (12), header lot (1) |
| `history` | NIFTY, VIX and each expiry's put-call ratio series, aligned to `dates`, plus `coverage` | NIFTY card's 5D/1M/3M (2), mood's 3-month VIX middle (5) |
| `contracts/{code}/history` | one contract's daily close (null without trades) and OI, `periods` d5/m1/m3/life with coverage | contract history (12) |
| `sources` | NSE sources and as-of, the 3 pm quotes' status, how IV and chances are computed, the books' state | source chips (6), Buy/Sell grey (13) |

Files:
- `api/paths/blocks-chain.yaml`;
- `api/schemas/blocks-chain.yaml` and `blocks-chain-history.yaml`;
- the responses appended to `blocks-responses.yaml`;
- the examples in `api/examples/blocks-32.json` (built by `tools/api/examples_chain.py`);
- 17 elements `c32.*` in `api/catalog/elements.yaml`;
- the catalog re-rendered in `api/catalog/catalog.md`.

## Criteria (W11's 1-6 applied to 32)

1. **One fixture per shared endpoint.** Every endpoint has a validated example built from 32's `data.json` (the real
   NSE files of 12 Oct 2026, labelled Mock); there are 9 examples in all.
   - `rows` has the default and the weekly 3 pm band: 27 Oct near, 21 strikes; 13 Oct band, 45 strikes.
   - `history` has the full extract (93 sessions, 1 Jun to 12 Oct) and `_short`, the last 30 sessions, which shows the
     nulls.
   - `contracts/{code}/history` has the ATM call `NIFTY26OCT22350CE` (52 sessions, so 3M is incomplete) and
     `NIFTY26DEC22000CE` (93 sessions, every period covered).
   - `examples.py --check` rebuilds them byte for byte. `blocks.json` and `blocks-33-34.json` are unchanged.
2. **Independent blocks.** `check_mapping.py` finds zero gaps both ways (every notes.md token maps to a field, every
   field serves an element), and no endpoint mixes two independent blocks.
   - The NIFTY, range, positions and mood cards form one block, `in-one-look`. Evidence: the template renders them
     in one container (`mb-oclook`, comment "1. in one look: the four questions a user asks first").
   - `lot` moved from `underlying` to `rows`. It is a column of every contract row in NSE's file (`NewBrdLotQty`), and
     the chain needs it for ₹ a lot. Carried in `underlying`, it would have bundled the page head with the cards.
   - The 4 endpoints that feed several blocks state why in `x-shared`.
3. **US absent by schema.** Every chain path is under `/markets/india/`, the envelope's `market` is the constant
   `india`, and every object is closed (`additionalProperties: false`). There is no US path, schema or example.
4. **Coverage on history-dependent fields.**
   - NIFTY's 5D/1M/3M change and VIX's 3-month middle are `CoveredValue`s. `value` is a number only when `complete`,
     else null; the schema enforces this with if/then/else.
   - A contract's periods are `PeriodCoverage`.
   - The new `check_chain` (in `check_semantics.py`) recomputes every coverage from its series and checks the series
     are aligned to `dates`.
5. **Additive-only changes.** New files and appended responses only. The version goes from 2.2.0 to 2.3.0, and no
   existing schema, path or example changed.
6. **Checks green** (13 Oct, this commit):
   - check_contract: 70 paths, 43 block endpoints, 81 examples, 873 catalogued leaves, **39 planted breaks** (7 new),
     all caught;
   - check_mapping: zero gaps;
   - examples --check: current;
   - code size: within limits;
   - web: typecheck, 372 tests pass and 0 fail, build passes.
   - The 7 new planted breaks:
     - chain rows served for the US;
     - a `bid` on a chain row;
     - rows without `as_of`;
     - a 3M NIFTY change on 30 sessions (schema);
     - 3M marked complete on the 52-session contract (semantic);
     - a 1M change not from its series (semantic);
     - a 3M VIX middle marked complete on 30 sessions (semantic).

## Doubts and limits (stated, not hidden)

- **The mockup's NIFTY card would show a partial period as a full one** (reasoning, from the template). It takes
  `from = max(0, n - 1 - span)`, so a history shorter than 63 sessions would label a shorter change "Three months".
  The contract publishes null with `days` instead. The app's build of 32 must show "29 of 63 days", not a number. The
  12 Oct data (93 sessions) does not hit this case.
- **Leaf-use flags (report only):**
  - The header reads 1 of 20 leaves of `rows` (`lot`) and 1 of 6 of `underlying` (`sym`). The page loads both anyway.
  - The tray, OI and IV charts read 1 to 2 columns of `rows`. They plot or price the same rows the chain shows, so a
    second copy would duplicate the table.
  - `buysell` reads 1 of 10 leaves of `sources`.
- **The mock envelope's `publication_id`** is `mock-2026-10-07` for every F&O example. It is inherited from W10's
  envelope builder and is not 32's day (12 Oct). It is harmless as a mock id, but noted.
- **Nothing here is published.** All six rows say "no: no backend publishes it". The backend story is
  `TR-CHAIN-proposed`, "to be added in exepex/trading".

## Questions for the owner

1. **"All" strikes:** should `strikes=all` be the extract's ±10% (as in the mockup), or every strike NSE lists, which
   can be over 100 an expiry? The contract says ±10% today, per notes.md row 8.
2. **Contract history scope:** the mockup keeps history only for the 21 strikes nearest the money of each expiry.
   Should the backend keep the A3 panel for every contract, so the endpoint never answers 404 for a listed code, or
   only for those 21 strikes?
3. **Weeklies:** they are end of day only, with no future (`future` null). Should the chain also show weeklies'
   3 pm quotes once A4 records them, or keep them monthly-only like the F&O tool?
