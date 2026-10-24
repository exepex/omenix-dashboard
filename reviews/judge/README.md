# Independent judge verdicts

Written only by the independent judge session (`docs/JUDGE.md`): `judge_<n>_<story>.md`, newest last.

- [judge_1_logo_legal.md](judge_1_logo_legal.md): logo in mockups and app, /privacy and /terms (fa62154, judged at ed21a5a): **FAIL**; 3 should fix (no public home page on the gateway, deployment docs, stale OM screenshots), 5 minor.
- [judge_2_logo_legal_rejudge.md](judge_2_logo_legal_rejudge.md): re-judge of judge 1 (fixes 25e453a, 3822fd4): **PASS**; judge 1 findings 1-5 and 7 fixed (6 except one comment, 8 for the owner); 6 new minor (style-guide PNGs still "OM", README omits the real gateway host and that deploying it from this repo is a partial cutover, one "request time" comment, home-page wording, no builder response file, three identical 30-shell phone state shots).
- [judge_3_W3i-card-reasons.md](judge_3_W3i-card-reasons.md): W3i card reason codes, story text round 1 (6de707e06): **FAIL**; 1 blocking (Part A starts contract 2.14.0, which the 16 Oct pause also stops: DESK_DECISIONS lines 238, 244, 294), 2 should fix (the version bump's side effects on fno-screens.json, mockup pages and labels; A4's YAML read with no parser in web), 1 minor (test plan 1 wording).
