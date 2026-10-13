# Response 14: issue #2, round 2, answers to judge 36

Judge 36 (FAIL: 2 should-fix, 2 minor) is `exepex/trading` `reviews/judge/judge_36_db_check_issue2.md` (`b93e806`).
Round 1 is `response_13_db_check_issue2.md`. The orchestrator confirmed through the GitHub API that
`exepex/omenix-dashboard` is public. The fixes are in the commit that adds this file.

## 1. Should fix: a missing secret is a silent pass. **Accepted.**

- The missing-secret logic moved from the workflow into `monitor/run.sh`, where it is tested.
- **Before setup:** with no `DB_CHECK_ENABLED`, a run without the secret prints only a notice, as before.
- **After setup:** `owner/setup_monitor.sh` sets the repository variable `DB_CHECK_ENABLED=true` (`gh variable set`)
  once the secret is saved. From then on a missing secret gives `RESULT: UNKNOWN (the secret
  OMENIX_DB_MONITOR_PASSWORD is missing although DB_CHECK_ENABLED=true)`: exit 2, the public alert and the private
  details.
- **Proof** (`tests/monitor_test.sh`):
  - `ok: no secret and not enabled: a notice only`;
  - `ok: a lost secret while DB_CHECK_ENABLED=true: alert raised in public with counts only; details went to the
    Slack sender`.

## 2. Should fix: the report is published (the repository is public). **Accepted.**

- **Public:** `monitor/run.sh` now prints one summary line to the run log and passes only that to the issue
  (`monitor/alert.sh` no longer receives the report). It carries status, counts and check time, for example
  `Database check ALERT: 1 finding(s), unknown parts: 0, checked 2026-10-13 11:22 UTC`, plus whether the details
  reached Slack.
- **Private:** the details go only to Slack #fno-desk (`C0C89E8QCCD`, fixed in `monitor/notify_slack.sh`; no other
  channel) with the existing F&O bot token, stored as this repository's secret `FNO_SLACK_BOT_TOKEN`. The owner
  pastes it once at a hidden prompt in `setup_monitor.sh`, which saves it through `gh`'s stdin. The token reaches
  Slack in a header read from stdin, never on a command line.
- **Choice and residual risk** (reasoning only):
  - E-mail through the Azure action group cannot be reached from Actions, and a private GitHub issue is impossible
    in a public repository, so Slack is the simplest private channel without new infrastructure.
  - The cost is a second copy of the bot token, in this public repository's secrets, readable by anyone who can
    change its workflows (its writers only). A leaked token can post to the bot's channels.
  - Making the repository private would remove both the exposure and the need.
- **Proof** (`tests/monitor_test.sh`), for each planted condition (large objects, persistent timeout, grant drift,
  unreachable server, lost secret):
  - the public log and the fake issue contain none of `dashboard_app`, `stock_writer`, `statement_timeout`,
    `database postgres`, `large object`, `bytes`, `acl `, `role setting` or the token;
  - the fake Slack call carries the detail.

  When Slack refuses (`channel_not_found`), the public alert says `Details sent privately to the owner's Slack
  channel: no (...)`, and the run still fails.
- **Setup output:** `setup_monitor.sh` now prints the first check's details on the owner's screen only, not into the
  evidence file.

## 3. Minor: the 60-day pause. **Accepted.**

- **Visible last success:** every Monday, the 03:xx UTC run, when OK, posts `db-check heartbeat: last successful
  check of omenix-pg <time>` to #fno-desk, where the owner looks daily. If the heartbeat stops, the check has
  stopped.
- **Keep-alive:** a new monthly workflow `keepalive` (`monitor/keepalive.sh`) commits
  `platform/monitor/keepalive.txt` only when `main` has had no commit for 45 days. It is kept apart, so that
  `db-check` never holds write access to the code.
- **Proof:** heartbeat test; keep-alive tested on a throwaway repository (commits after 50 idle days, does nothing
  when active).
- **Doubt:** that a bot's commit counts as "activity" for GitHub's rule rests on GitHub's documentation and common
  practice, and is untested here (some evidence).

## 4. Minor: "no data access" was over-broad. **Accepted.**

The README now says that `db_monitor` sees no row data of any table, but, like every PostgreSQL role, does see catalog
metadata: table and column names, row counts from the statistics views, role names and settings.

## Test results

- `tests/monitor_test.sh`: all checks pass.
- `tests/owner_scripts_test.sh`: also checks that the Slack token is never printed or passed as an argument.
- `platform/tests/ci.sh`: passes locally and on the `postgres:16` image.
- bash 3.2: the trap and owner-script tests pass.
- code-size: OK.
- web: typecheck, tests and build pass.
