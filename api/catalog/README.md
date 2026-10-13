# api/catalog/: the data catalog of the block endpoints (stories W10 and W11)

The owner (13 Oct 2026): "multiple small APIs which could populate the screen in parallel instead of a big bulky API
call". The signed-off frame (`design/mockups/30-shell/notes.md`), Home (`31-dashboard`), screener (`33-screener`) and
Markets overview (`34-markets`) are served by 37 small read endpoints, one per independent screen block, each with its
own schema, envelope, freshness, cache rule, empty state and examples. The catalog's "Published today?" column says
plainly which blocks no backend publishes yet (the NSE-file blocks: publisher `nse_ingest`, story `NSE1-proposed`).

| File | What it is |
|---|---|
| `catalog.md` | **The catalog** (generated): every endpoint, which screen blocks it feeds, and every field with its publisher, source read model or table, unit, freshness, story and status |
| `elements.yaml` | Every element of the four notes.md files (30 and 31 whole; 33 and 34 their "Elements" table) and every backticked field token, mapped to contract keys (hand-written; checked against notes.md) |
| `stories.yaml` | The stories that build or publish the data; `exists: false` marks a story still to be written |

## How the contract carries the catalog

The catalog lives in the schemas, so it cannot drift from them (`api/schemas/blocks-*.yaml`):
- `x-catalog: {publisher, source, freshness, story, status}` on a schema or property, inherited downward; a property
  overrides single keys; an operation's own `x-catalog` is the base, so one schema can serve India's and the US's
  paths with different publishers. `publisher` is `stock` (contactexepex/agentic-stock-prediction), `fno`
  (exepex/trading), `nse_ingest` (NSE's daily files; no backend publishes them yet and the owner has not chosen the
  repository) or `dashboard` (this repository). `status: published` means the publisher stores the value today in the named source
  and only the block row is new; `planned` means no backend publishes it yet and `story` will.
- `x-element`: the notes.md elements a field feeds (inherited); `x-notes: ["<element>:<key>"]`: the notes.md field
  token it implements; `x-unit` on every leaf. A field serves only the elements its operation lists in `x-feeds`
  (a shared quote row names every block that reads it); a field left with none fails the check.
- `x-price: true` on a price or a value marked to a price: its object must require `as_of`, or name with
  `x-as-of-from` the page schema whose required `as_of` covers every row (one day's table of closes).
- `x-aggregate`: `group_total` (the owner's one allowed sum, per group, AGENTS.md 13 Oct 2026; only in `GroupTotal`)
  or `single_account` (one account's own figure). No other field adds numbers up.
- `x-market: india` on an India-only field; the response schemas reject it in the US (`Us*Rule`).
- Operations: `x-publisher`, `x-read-model` (target row, and the interim existing row a route may project until the
  backend publishes it), `x-freshness`, `x-cache`, `x-empty`, `x-feeds` (the elements it feeds, checked) and
  `x-shared` (why one record feeds several screen blocks).

## Design choices (with confidence)

- **One endpoint per block and publisher** (strong evidence: the mockups' blocks load from different runs at different
  times: pre-open picks, post-close scoreboards, the news run, the F&O 3 pm run). A block's failure or staleness stays
  in that block. Where one record feeds several blocks (the session in the chip and in Home's band), it is served once
  and the endpoint says so (`x-shared`); `tools/api/check_mapping.py` fails if any endpoint's payload parts feed
  disjoint blocks.
- **F&O only under `/api/v1/markets/india/fno/`** (strong evidence: CLAUDE.md "absent, not empty"): the US has no F&O
  path at all, so no F&O field can leak into a US screen; India-only fields inside shared blocks (the Manual account's
  `open_structures`, `at_risk`; the `eod` and `snap3pm` sources; F&O expiries) are rejected for the US by schema.
- **Backends publish one row per block** (some evidence; it needs the proposed stock story K4-proposed and the
  P1 extension): the same `rm` envelope, page_key = the block. Until then each stock route can project the same fields
  from today's rows (`x-read-model` "interim"), so W8 and W9 are not blocked.
- **The client decides open or closed from the session times and its clock** (strong evidence: a stored "open now"
  flag goes stale between runs).

## Checks (run before every push)

```
pip install -r tools/api/requirements.txt
python3 tools/api/check_mapping.py      # criteria 1-2: notes.md <-> elements.yaml <-> schema fields, zero both ways; independence;
                                        # leaf use per endpoint and block (FLAG under 50 %: a block downloading data it never shows)
python3 tools/api/check_contract.py     # criteria 3-5: OpenAPI 3.1 validation, examples, catalog completeness, screen rules, planted breaks
python3 tools/api/examples.py --check   # the examples are exactly what the mockups' data gives
python3 tools/api/render_catalog.py --check
```
After changing a block schema: `python3 tools/api/examples.py` (if the payload shape changed), then
`python3 tools/api/render_catalog.py`.
