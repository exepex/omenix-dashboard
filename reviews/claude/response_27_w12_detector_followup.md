# W12 follow-up: a bare "GPT" in prose and gpt-oss names (builder)

After W12's PASS (judge, round 3), the orchestrator relayed one minor: the model-name detector missed a bare "GPT" in
prose and names like "gpt-oss-120b". Real company names such as "GPT Healthcare" must stay unflagged in security
fields. Paths are under `web/` unless they say otherwise. Confidence labels: **strong evidence**, **some evidence**,
**reasoning only**.

## The design question, and the answer

A text-only rule cannot do both: "GPT" alone is a model in a sentence and a company in a name. So the detector now
knows where a text sits (`lib/ui/model-names.ts`, `modelNameIn(text, { security })`).
- **Prose** (sentences, labels, tooltips): a bare "GPT" is a model.
- **A security's name**: "GPT" counts only with a version or size, so "GPT Healthcare Limited" and "GPT Infraprojects
  Limited" pass, while "Moneyview GPT-4o Limited" is still caught.
- **"oss" is a variant**, so "gpt-oss-120b" and "GPT-OSS-20B" are caught in both places.

**Where the names are marked.** The pages mark the elements that render a security's name with `data-security`:
- the Screener's stock and F&O rows;
- the Markets movers;
- the frame's quick view and hover card.

The UI harness's gate (every case, every page) reads the marked names in security mode and everything else as prose.
The judge-45 plant now goes into the marked name itself, and the gate catches "Moneyview GPT-4o Limited" there at
every width.

## Tests

- `lib/ui/tests/strategy-names.test.ts`:
  - prose flags "Scored by GPT today", "the gpt-oss-120b run" and "GPT-OSS-20B";
  - security mode passes GPT Healthcare and GPT Infraprojects, and flags "Moneyview GPT-4o Limited" and
    "Acme gpt-oss-120b Limited";
  - the symbol "GPTHEALTH" is not the word.
- The fixture test reads the rows' `n` as names, so 33's GPT companies stay unflagged; every other text is read as
  prose.

**Strong evidence.**

## Limit (reasoning only)

Only the places listed above mark names. A page I did not touch that showed a company called "GPT …" in prose (none of
today's fixtures has one) would be flagged, and that would be visible, not hidden. Such a page can mark its name the
same way.

## Checks

Code size, typecheck, unit tests, build and the full UI harness: in the commit's report line.
