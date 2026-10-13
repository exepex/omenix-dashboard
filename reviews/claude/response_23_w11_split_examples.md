# Response 23: W11, the examples after the split and bonus fix (design 000df7a)

The design session adjusted 33's past NSE prices for splits and bonuses (000df7a), and that commit regenerated the API
examples. I verified them. **No change from me** in contract, examples or tools.

## Verification (on main after 000df7a)

- check_contract, check_mapping, `examples.py --check` and `render_catalog.py --check` all pass.
- **Served schemas unchanged:** no file under `api/paths` or `api/schemas` changed.
- `blocks.json` and `blocks-32.json` are unchanged; only `blocks-33-34.json` changed.
- **Every changed stock-row value matches design's `changes_2026-10-13_splits.csv`** (my script: 5 of 5).
- Every changed sector value and breadth count matches `34-markets/changes.md`.

**One value checked against NSE's own files, because it looked wrong:** CUPID's 1Y went from 68.29 % to 741.4 %.
NSE's equity files show it closed at 402.20 on 6 Mar 2026 and 91.60 on 9 Mar 2026: a real 4:1 bonus (factor 0.2).
Adjusted, the year-ago close is 43.00 against 361.80 now, so +741.4 % is right.

## Every changed example field (`api/examples/blocks-33-34.json`: 169 values in 4 examples)

| Example | Change |
|---|---|
| `getScreenerStocksIndia_india` | KOTAKBANK `y1` −79.15 → 4.24, `h` 2,266.00 → 453.20; CUPID `y1` 68.29 → 741.40, `h` 526.95 → 368.95, `l` 74.60 → 41.82 |
| `getScreenerStocksIndia_india_high` | `total` 50 → 54. The page's set changes: KMEW and MOLDTECH come in, CUBEXTUB and GANDHAR leave, so 9 positions change every field (149 values, by position). Of the rows kept, 8 `y1` values move. |
| `getScreenerSummaryIndia_india` | all: `near_high` 50 → 54, `near_low` 254 → 247, `up_1m` 689 → 692; screens `volume` 64 → 63, `trend` 246 → 247, `fall` 653 → 648, `oversold` 265 → 248. n500: `near_high` 6 → 7, `near_low` 55 → 54 |
| `getIndiaSectors_india` | 20 industries' `y1` (e.g. Financial Services −9.49 → −0.21, FMCG −4.11 → 20.06) and Capital Goods `m3` −1.46 → −0.40 |
| each of the 4 | envelope `payload_sha256` |

**Not changed:** the US examples, the F&O rows, the index rows (indices are never split) and Markets' gainers.

## One gap in design's record (minor, for the design session)

`34-markets/changes.md` lists the breadth counts that 34 shows. The screener's own screen counts in the same summary
(volume 64 → 63, trend 246 → 247, fall 653 → 648, oversold 265 → 248) are listed in neither 33's nor 34's
`changes.md`. They are derived and correct, since they recompute from the rows, but the before and after record is
incomplete.
