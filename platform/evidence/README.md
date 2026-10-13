# X1 evidence from the real server (`omenix-pg`, 13 Oct 2026)

The owner ran `platform/owner/` steps 1 to 6 on the Mac against `omenix-pg` and saved the outputs to Drive
(`fno-research/evidence/x1/`). They are committed here unchanged except for scrubbing:
- every IPv4/IPv6 address is replaced by `<IP address>` (`owner/lib.sh` `redact_ips`; it hit 2 addresses in the TLS
  file: the client's public IP and the server's);
- the local path of the owner's clone is shown as `<repository>`;
- the admin login is shown as `<admin>`, as the catalog snapshot prints it;
- the Azure CLI's install path in one of its own Python warnings (step 6) is shown as `<az install>`.

No password, token, connection string, subscription ID, e-mail or human user name is in these files. The only host
name is the server's.

Owner decisions (13 Oct 2026, recorded in `exepex/trading` `docs/DESK_DECISIONS.md`): first "let's skip these
checks. we don't need them"; later the owner ran step 5 (restore test) and step 6 (delete lock, alerts) after all.
Steps 3 and 4 are not rerun with the fixed scripts.

| File | Step | Script version |
|---|---|---|
| `2026-10-13-x1-apply.txt` | 1, apply `platform/sql` | current at the time |
| `2026-10-13-x1-real-matrix.txt` | 2, role matrix with each runtime credential | current at the time |
| `2026-10-13-x1-tls.txt` | 3, TLS | before the IP-redaction fix (redacted here by hand with the same function) |
| `2026-10-13-x1-server.txt` | 4, server settings | before the az firewall-rule fix (`742443d`) |
| `2026-10-13-x1-restore.txt` | 5, restore test | before the bash 3.2 trap fix (see "Left on the server" below); nothing needed scrubbing |
| `2026-10-13-x1-protect.txt` | 6, delete lock and alerts | current at the time |

## Per criterion

| # | Criterion | Result on the real server | Evidence |
|---|---|---|---|
| 1 | Role matrix passes for every role | **PASS.** All 4 runtime credentials, over verified TLS (`sslmode=verify-full`): 312 checks, 280 passed, 0 failed, 32 OPEN (exactly the 8 named exceptions per role). The catalog snapshot is identical to `tests/expected_catalog.txt` (the owner of schema `public` is Azure's `azure_pg_admin`, printed as `<platform default>`; see `README.md`). There are no large objects in any of the 5 databases. | `x1-real-matrix.txt`; `x1-apply.txt` (step 1: `catalog identical … yes`) |
| 2 | A runtime role cannot create an object anywhere | **Met inside `omenix`; NOT met in full, with named exceptions.** Every create, alter, drop and temp check was refused (42501) for all 4 runtime roles. Still OPEN: large objects in all 5 databases (Azure's admin may not revoke them), and connect plus temp tables on `azure_maintenance` and `azure_sys` (Azure-owned). `postgres` and `template1` are now closed. Also open: own timeout and own password (PostgreSQL behaviour). | `x1-apply.txt` ("still open" blocks); `x1-real-matrix.txt` (OPEN lines) |
| 3 | TLS required, non-TLS refused | **PASS.** `require_secure_transport` = on, minimum TLSv1.2. A plain connection was refused by the server ("no pg_hba.conf entry … no encryption"). The verified connection used TLSv1.3 with TLS_AES_256_GCM_SHA384. | `x1-tls.txt` |
| 4 | Backups with stated retention; one restore tested | **PASS.** Retention: 14 days, as the README states (earliest restore point 12 Oct 21:17 UTC). Restore: a marker row with a random token was written at 08:58:07 UTC. `omenix-pg` was restored to 09:03:07 UTC as the scratch server `omenix-pg-x1restore`; Azure took 7 minutes (09:13 to 09:20 UTC). On the scratch server the marker row was there with the same token, and the catalog was identical to `expected_catalog.txt`. Firewall rules were not copied, as Microsoft documents; the script opened the scratch server to the owner's Mac only. The scratch server was deleted and confirmed gone after about 1 billed hour. **Cost: pending** (the owner reads it from Azure Cost Management a day later; estimate USD 0.03 to 0.06). | `x1-server.txt`; `x1-restore.txt` |
| 5 | Firewall and public-access policy written and matching the server | **Mostly read; firewall rule UNREAD.** These match the README: location, SKU, tier, version, storage, performance tier, backup retention, public network access, encryption, and `require_secure_transport`. The firewall rule could not be read because of the old script's bug (`unrecognized arguments: -n omenix-pg`; fixed in `742443d`, not rerun by owner decision). The owner set the one rule (0.0.0.0-255.255.255.255) when creating the server. | `x1-server.txt` |

## Left on the server by step 5 (builder's bug; removed by the owner)

The restore script was meant to drop its marker table `fno.x1_restore_marker` on `omenix-pg` when it ended. That
drop ran in an EXIT trap set inside a `{ ...; } | tee` block, and bash 3.2 (the macOS default) never runs such a trap.
The evidence file shows it: no "marker table dropped" line after step 5. Reproduced in `mirror.gcr.io/library/bash:3.2`
(strong evidence). So the table, with one row holding the random token and no secret, stayed on `omenix-pg`. **The
owner dropped it by hand** (13 Oct 2026, reported via the orchestrator) with
`SET ROLE fno_owner; DROP TABLE IF EXISTS fno.x1_restore_marker;`.

Root cause fixed for every owner script: the body stays in the main shell, with output recorded through
`record_evidence` (`owner/lib.sh`), so traps run on every bash. Tests: `tests/bash32_trap_test.sh` runs the pattern,
and `tests/owner_scripts_test.sh` forbids traps inside pipeline blocks; CI runs both on bash 3.2 as well. Fixed in
commit `a0bb4bb`.

## Step 6: delete lock and alerts (PASS)

From `x1-protect.txt`:
- **Delete lock:** `omenix-pg-no-delete`, CanNotDelete, on `omenix-pg`. Deleting the server, and with it its backups,
  first needs the lock removed by hand.
- **Action group:** `omenix-db-alerts`, with 1 e-mail receiver (the address stays in Azure).
- **Failed-connection alert:** `omenix-pg-failed-connections`. It fires when the total of `connections_failed` is
  above 10 in 15 minutes, checked every 5 minutes, severity 2. It counts every failed connection, not only wrong
  passwords, and names no user or address.
- **Storage alert:** `omenix-pg-storage`. It fires when the average of `storage_percent` is above 80 over 15 minutes,
  checked every 5 minutes. It is server-wide, so it covers large objects in every database.

Azure registered the `microsoft.insights` provider during the run (a one-time warning). The az CLI's own Python
`SyntaxWarning` is noise from az 2.91.0, not an error.

## Not met by owner decision, and the risk accepted with it

- **Firewall rule read-back (criterion 5):** the server's firewall rule is not recorded by `az` output: the old script
  failed to read it, and step 4 was not rerun with the fixed script. The policy rests on the owner's setup and on the README.
- **Restore cost (criterion 4):** pending; the owner reads it from Azure Cost Management a day later.
