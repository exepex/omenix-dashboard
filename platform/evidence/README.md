# X1 evidence from the real server

Files written by the owner scripts in `platform/owner/` when the owner runs them against `omenix-pg`, then read and
committed by the owner. Nothing here may contain a password, token, connection string, subscription ID or the admin
user name; the scripts print none of them (the catalog snapshot shows the admin as `<admin>`, and the `az` queries
select named fields only). Read each file before committing it.

| File | Criterion | Script |
|---|---|---|
| `<date>-x1-real-matrix.txt` | 1, 2 | `owner/run_real_matrix.sh` |
| `<date>-x1-tls.txt` | 3 | `owner/check_tls.sh` |
| `<date>-x1-restore.txt` | 4 | `owner/restore_test.sh` |
| `<date>-x1-server.txt` | 5 (and tier, region, backups) | `owner/server_evidence.sh` |
