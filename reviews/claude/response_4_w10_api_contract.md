# Response 4: story W10, API contract and data catalog for the frame and Home (builder's claims)

Story: `exepex/trading` `docs/stories/X-cross-repository.md` section W10. Inputs (signed off and frozen 13 Oct 2026):
`design/mockups/30-shell/notes.md` (as of cadf1d2) and `design/mockups/31-dashboard/notes.md` (as of e8cd360), their
`data.json`, templates and gallery. Nothing in `design/` or `web/` was changed. Contract version 2.0.0 -> 2.1.0
(additions only; the web app's `CONTRACT_MAJOR` stays 2).

## What was built

- **23 small read endpoints** (tag `blocks`): 18 market-scoped (`/api/v1/markets/{market}/...`, stock tool or
  dashboard), 5 F&O (`/api/v1/markets/india/fno/...`, India only) and the market switch (`/api/v1/frame/markets`).
  Files: `api/paths/blocks-frame.yaml`, `blocks-home.yaml`, `blocks-fno.yaml`; schemas `api/schemas/blocks-common.yaml`,
  `blocks-frame.yaml`, `blocks-picks.yaml`, `blocks-search.yaml`, `blocks-trade.yaml`, `blocks-home.yaml`,
  `blocks-responses.yaml`; examples `api/examples/blocks.json` (46, generated).
- **Data catalog:** `api/catalog/catalog.md` (generated from the schemas' `x-catalog`, `x-unit`, `x-element`),
  `api/catalog/elements.yaml` (every notes.md element and token), `api/catalog/stories.yaml`, `api/catalog/README.md`.
- **Checks:** `tools/api/check_mapping.py` (criteria 1-2), `tools/api/check_contract.py` (criteria 3-5, with 13
  planted breaks), `tools/api/examples.py --check`, `tools/api/render_catalog.py --check`; bundler `tools/api/bundle.py`;
  pinned `tools/api/requirements.txt`; CI job `.github/workflows/api-contract.yml`.
- **Old Home endpoint superseded:** `api/paths/home.yaml:7` `deprecated: true`, `:12` `x-superseded-by` (kept while the
  current app reads it).

## Endpoints (path · blocks it feeds · publisher)

| Endpoint | Feeds | Publisher |
|---|---|---|
| `/api/v1/frame/markets` | market switch | dashboard (config) |
| `/markets/{m}/approaches` | approaches vocabulary, pick-rule labels | dashboard (config) |
| `/markets/{m}/price-sources` | freshness rules (US: close only) | dashboard (config) |
| `/markets/{m}/session` | status chip, trading lock, Home band's session line | stock tool |
| `/markets/{m}/indices` | index strip, Home band's indices | stock tool |
| `/markets/{m}/tracked-moves` | Home band's tracked companies | stock tool |
| `/markets/{m}/notifications` | bell | dashboard (rules over both backends' runs) |
| `/markets/{m}/search?q=` | search: stocks, indices, strategies, news | stock tool |
| `/markets/india/fno/search?q=` | search: futures and options | F&O tool |
| `/markets/{m}/picks` | picks panel (rows, agreement, Yes/No, record, go-live, no-pick), Home top pick, inline picks | stock tool |
| `/markets/india/fno/picks` | picks panel F&O note and rows, basket margin | F&O tool |
| `/markets/{m}/instruments/{id}` | hover card, quick view, order price basis (stocks, indices) | stock tool |
| `/markets/india/fno/contracts/{code}` | hover card, order price basis, refusal rule (contracts) | F&O tool |
| `/markets/{m}/accounts` | order window account, glance account, You card, owner defaults | dashboard (Manual account, MA1-proposed) |
| `/markets/{m}/positions` | Home "yours", glance account, You card count, hover "held" | stock tool |
| `/markets/{m}/order-rules` | stock charges, stock fill time | stock tool |
| `/markets/india/fno/order-rules` | option charges, limits, margin, option fill time | F&O tool |
| `/markets/{m}/groups` | Who trades: group totals, strategies, Baselines line | stock tool |
| `/markets/india/fno/books` | Who trades F&O lines; order window book accounts | F&O tool |
| `/markets/{m}/strategy-trades` | open paper trades: strategies' | stock tool |
| `/markets/{m}/attention` | Needs you; glance count | dashboard (rules) |
| `/markets/{m}/events` | Coming up | stock tool |
| `/markets/{m}/top-news` | Top news | stock tool |

## Criteria, claims and evidence

**1. Every element maps to endpoint fields; zero gaps both ways.** `python3 tools/api/check_mapping.py`:
```
elements: 41 (35 need data, 6 static with a reason); field keys: 181; endpoints: 23; endpoint fields: 569 (415 leaves)
elements without an endpoint field: 0; endpoint fields without an element: 0
endpoints feeding more than one screen block (the same record, with x-shared): 11 of 23
mapping: zero gaps both ways; no endpoint mixes two independent blocks
```
How: `check_mapping.py` parses both notes.md (table rows and prose sections, every backticked token) and requires
`api/catalog/elements.yaml` to list the same rows and the same token multisets; every token is a field (with contract
keys) or "other" with a reason (e.g. `NIFTY26OCT22800CE` an example value, `open_trade.exit_date` a rule input). Each
field key is implemented by exactly one schema node (`x-notes`), every leaf names the element it serves (`x-element`).
6 elements are static with a stated reason (brand text, theme, filter chips, example clock, navigation, the order
"Result" which is a write). A token with two keys exists only where notes.md itself names two publishers (e.g.
search `last`: stock tool for stocks, F&O tool for contracts), each with `why`. Planted breaks I ran: removing the
`zone` mapping -> "field key s30.status-chip:zone: implemented by 0 schema nodes"; adding a field with no element ->
"serves no element".

**2. Independent blocks have independent endpoints.** Every operation has `x-feeds` (checked equal to what its fields
serve). `check_mapping.py` `independence()` (`tools/api/check_mapping.py:86`) fails when two top-level parts of one
payload feed disjoint screen blocks (blocks from `elements.yaml` `block:`), and requires `x-shared` when one record
feeds several blocks (11 endpoints, e.g. the session in the chip and in Home's band: one fact, served once). Every
endpoint has one publisher (`check_contract.py` fails a payload field whose publisher differs from its endpoint's).

**3. The bundle validates; every schema has an example from the mockups' data.** `python3 tools/api/check_contract.py`
(with `openapi-spec-validator` 0.7.2):
```
contract: 50 paths (23 block endpoints), 46 block examples, 74 block schemas, 415 catalogued leaf fields, 13 planted breaks
contract: OpenAPI 3.1 valid; examples valid and current; catalog complete; screen rules hold; every planted break caught
```
`tools/api/examples.py` builds each example only from `30-shell/data.json` or `31-dashboard/data.json` (filtering,
sorting, copying; envelope hashes computed); `--check` proves the committed file equals that output. Every example
is validated with jsonschema 2020-12 against its response schema (dates and times format-checked); every one of the
74 block schemas is reached by at least one example value (`check_coverage`). India and US examples for every
market-scoped endpoint, India only for F&O.

**4. The catalog names publisher, source, unit, freshness and story for every field; planned fields carry
`x-status: planned` with their story.** `api/catalog/catalog.md` (generated; `render_catalog.py --check` passes).
`check_catalog` fails any leaf missing one of publisher, source, freshness, story, status or unit, or naming a story
not in `stories.yaml`. Counts: 415 leaves; 113 `published` (the stock tool stores them today: rm.status, rm.home,
rm.companies, rm.bars, rm.portfolio, rm.strategies, rm.trades, rm.news), 302 `planned`. Planted break: story `W99` ->
"story W99 is not in stories.yaml".

**5. Screen rules.** All enforced by schema and proven by planted breaks in `check_contract.py:188` `planted()`:
- F&O absent in the US: F&O endpoints exist only under `/api/v1/markets/india/fno/` (checked); `FnoBlockMeta` pins
  `market: india`; India-only fields inside shared blocks are rejected for the US (`blocks-responses.yaml:114-126`:
  `eod`/`snap3pm` sources, the Manual account's `open_structures`/`at_risk`, F&O expiries in the calendar); US
  examples are scanned for F&O words. Caught: open_structures and at_risk in the US account, snap3pm in the US, an
  F&O expiry in the US calendar, an F&O row with market us, a future in stock search, a hybrid stock pick.
- No sums across accounts or currencies: `MarketCurrency` (`blocks-common.yaml:70`) pins INR in India, USD in the US
  (caught: USD in India, INR in the US); `x-aggregate` only `group_total` (only inside `GroupTotal`,
  `blocks-home.yaml:43`) or `single_account`; the F&O book is its own block, never added to a stock total.
- As-of on every price: every object with an `x-price` field must require `as_of` (caught: IndexLevel without
  as_of required; an index level and a position without as_of).
- Paper on every block: `paper: Paper` required in every envelope (`blocks-common.yaml:33`; caught when removed).

**6. Repository checks.** `node tools/check_code_size.mjs`: "code size: every file within 350 lines or its listed
size" (largest new code file `tools/api/check_contract.py`, 230 lines; largest YAML 287 lines).
`cd web && npm ci --ignore-scripts && npm run typecheck && npm test && npm run build`: typecheck clean, tests
303/303 pass, build succeeds (web/ unchanged).

## Gaps and contradictions found in the frozen notes.md (reported, not changed)

1. **Two names for one value** (some evidence of a slip, harmless): 31 row 1 says `avg_price` and `pnl` for the owner's
   positions; row 5 says `avg` and `unrealised` for the same positions. The contract serves one field each
   (`OwnPosition.avg`, `.unrealised`) and maps both tokens to it.
2. **US limits are null in 30's data.json, but F&O must be absent in the US** (strong evidence): `markets.us.limits`
   holds three nulls and the US Manual account `open_structures: 0, at_risk: 0`. Those limits and figures are the F&O
   books' limits (notes "Limits ... F&O tool C2"). The contract makes them India only (absent in the US). The mockup's
   US data disagrees with that; the screen does not show them in the US.
3. **"Hybrid (India)" tab** (31 row 5) vs the fifth-round rationale (a hybrid stock strategy is planned in both
   markets) and the template, which shows the Hybrid tab in both markets. The contract allows `hybrid` stock trades
   in both markets (none exist yet); F&O book positions are not part of Home's open trades per notes (publisher: stock
   tool `open_trade` only).
4. **Search news `source` (30) vs top news `src` (31)**: kept as each notes.md says (separate endpoints).

## Doubts and risks (with confidence)

- **Three stories do not exist yet** (strong evidence): the stock backend publishing one row per block
  (`K4-proposed`), F&O pages beyond P1's list (`P1-extension-proposed`: contracts, quotes, order rules; P1 lists none
  of them) and the Manual account store (`MA1-proposed`; W8 calls it "a later story"). Until K4 lands, the stock
  routes can project the same fields from today's rows (`x-read-model` "interim"), so W8 and W9 are not blocked.
- **Units differ from the 2.0 pages** (strong evidence): block changes are percent points (30-shell/notes.md), the 2.0
  page payloads use fractions. Stated in `api/openapi.yaml` (Version 2.1) so W8/W9 do not mix them.
- **Strategy ids carry model family names** (strong evidence): ids such as `ai.combined.opus.v1` come from the stock
  tool and are in the mockups' data and so in the examples. The contract says the id is a key never shown on screen;
  the screen shows `strategy` ("AI team"). If the owner wants no model name even in payloads, the stock tool needs a
  new id scheme (outside W10).
- **Fields I added beyond notes.md tokens**, each tied to an element (some evidence they are needed): `as_of` on marked
  values (positions, strategy trades, the account, the books) for the as-of rule; `exchange` for the chip; `role` on
  index levels; `state`/`note` for inactive companies; `basis` on a group total (strategies sum or team record);
  `price_source` on positions. The F&O books' `as_of` in the example is the 3 pm snapshot time of 30's data.
- **The dashboard-composed blocks' envelope** (attention, notifications, accounts) takes the oldest input's times
  (reasoning only); W8/W9 may refine it.
