# api/: the app API contract (OpenAPI 3.1)

Owner of the layout and the shared parts: session B4 (docs/ws/b4.md). Each page session owns its own files.

| File | Holds | Owner |
|---|---|---|
| `openapi.yaml` | info (version), servers, security, tags, the shared parameters, headers, responses and schemas (Market, Ticker, Horizon N+k, Problem, ReadModelMeta, PageHeader, HorizonChoice, StatusBlock, GoLive, StrategyEntry, ...), the platform paths (markets, status, internal revalidate) and the 1.0 paths | B4 |
| `paths/<page>.yaml` | a map of path -> path item: the page's operations | the page's session |
| `schemas/<page>.yaml` | a map of schema name -> schema: the page's payload and response schemas | the page's session |
| `paths/blocks-*.yaml`, `schemas/blocks-*.yaml` | the block endpoints (tag `blocks`): the frame and Home (W10), the screener and the Markets overview (W11); one small endpoint per independent screen block | W10, W11 |
| `examples/blocks.json`, `examples/blocks-33-34.json` | the block endpoints' examples, generated from the signed-off mockups' data (`tools/api/examples.py`); web/ copies `blocks.json` as Home's fixture | W10, W11 |
| `catalog/` | the data catalog of every block field (`catalog/catalog.md`, generated) and the notes.md element map; see `catalog/README.md` | W10, W11 |

Every `$ref` in every file is written against the bundled document (`#/components/schemas/Market`), because the
bundle merges all files into one. In this repository `python3 tools/api/bundle.py > /tmp/openapi.json` prints it
(paths, schemas and the examples folder; a name defined in two files is an error). The stock repository's copy of the
2.0 pages keeps its own bundler and tests there (`scripts/marketbrief/warehouse/openapi_spec.py`,
`tests/test_openapi.py`, `tests/test_api_contract.py`), which check its read models against the 2.0 page schemas.

Checks in this repository (CI job `api-contract`; also run before every push):
`pip install -r tools/api/requirements.txt`, then `python3 tools/api/check_mapping.py` (every notes.md element maps to
block fields and back, zero gaps; no endpoint mixes independent blocks) and `python3 tools/api/check_contract.py`
(OpenAPI 3.1 validation of the whole bundle, every example valid and current, the catalog complete, the screen rules,
planted breaks caught).

Versioning: 2.0.0 was the wave of 2026-10-08 (the owner approved the major bump: the mockups' payloads replaced the
never-built 1.0 payloads of watchlist, stocks/{ticker}, track-record and news); 2.1.0 adds the block endpoints (W10,
additions only); 2.2.0 adds the screener and Markets overview blocks (W11, additions only). Additions bump the minor version, and a major version needs the owner. A page payload uses catalogue
fields only (`docs/DATA_CATALOGUE.md` of the stock repository); a missing field is a data request.
