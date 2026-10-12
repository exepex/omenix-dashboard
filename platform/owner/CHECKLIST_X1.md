# X1 owner checklist: the real-server criteria

Run on your Mac, from your clone of `exepex/omenix-dashboard` (after `git pull`). Each script prints what it does,
writes its output to `platform/evidence/`, and never writes or prints a password. **Type passwords only at the hidden
prompts** (or have them in your own `~/.pgpass`); never paste one into a chat, a file or a commit. Read every evidence
file before committing it.

## 0. Once: tools and settings

- [ ] `brew install libpq azure-cli` and put psql on the path:
      `echo 'export PATH="$(brew --prefix libpq)/bin:$PATH"' >> ~/.zprofile && exec zsh -l`
- [ ] `psql --version` shows 16 or later (needed for `sslrootcert=system`, which checks the server's certificate
      against your Mac's trusted roots).
- [ ] `az login` (browser opens), then `az account show --query name -o tsv` shows your subscription.
- [ ] In the terminal you use for the steps below (not in a file):
      ```
      export X1_RG='<the resource group of omenix-pg>'
      cd <your clone of omenix-dashboard>
      ```
- If verified TLS fails with a certificate error, download the two root certificates Azure lists for PostgreSQL
  ("DigiCert Global Root G2" and "Microsoft RSA Root Certificate Authority 2017") into one file and add
  `export X1_SSLROOTCERT=<that file>`; never use a weaker `sslmode`.

## 1. Bring the server to the declared state (1 minute, once)

The server still has the effect of the original `azure_setup.sql`. In `omenix`, `platform/sql` changes exactly one
thing (`platform/tests/catalog_difference.txt`): functions that the owner roles create later are no longer executable
by everyone (PostgreSQL's default lets `PUBLIC` execute every new function). Without this step the matrix in step 2
fails on purpose. It also **tries** to close named exceptions 1 and 2 of `platform/README.md` (other databases, large
objects); whether Azure's admin is allowed to is unknown until this run, and the answer is evidence either way.

- [ ] `platform/owner/apply_real.sh`: asks the admin name and password (hidden), prints the changes it is about to
      make (expected: the three `acl default functions` lines), applies `platform/sql/00..40`, and compares the result
      with `expected_catalog.txt`.
- [ ] Read the lines `database …: large-object functions still open for PUBLIC: …` (one per database) and the block
      `still open for PUBLIC` (other databases): each is a named exception the admin could not close (`none` /
      `0 rows` = closed). Warnings such as `no privileges could be revoked` belong to them. Both outcomes are fine to
      commit.
- [ ] If anything that uses the `postgres` database stops working after a successful revoke (nothing of ours does),
      undo it as admin: `GRANT CONNECT, TEMPORARY ON DATABASE postgres TO PUBLIC;`.
- [ ] Pass = `RESULT: catalog identical to expected_catalog.txt after apply: yes`. Commit the evidence file.

## 2. Criteria 1 and 2: the role matrix with each runtime credential (about 2 minutes)

- [ ] `platform/owner/run_real_matrix.sh`
  - asks the admin user name and password (hidden), then psql asks the password of `stock_writer`, `fno_writer`,
    `dashboard_app` and `stock_inbox_reader`, once each;
  - creates the probe tables `stock.x1_probe`, `fno.x1_probe`, `app.x1_probe` as the owner roles, runs 312 checks over
    verified TLS (every runtime role, including "connection is encrypted"), and drops the probe tables again, also
    after a failure;
  - compares the server's catalog with `platform/tests/expected_catalog.txt`.
- [ ] Optional, also the owner roles: `X1_INCLUDE_OWNERS=1 platform/owner/run_real_matrix.sh` (asks their passwords).
- [ ] Pass = last line `RESULT: matrix passed: yes; snapshot identical: yes; no large objects anywhere: yes; open named
      exceptions: N`. The large-object count covers every database that accepts connections. `OPEN` lines
      are the named exceptions of `platform/README.md` that the server does not enforce (expected: up to 8 per role,
      fewer if step 1 closed some); they are listed, never counted as passes.
  If the snapshot differs, do not change anything: commit the file and hand it over. A difference that only names
  Azure's own roles is expected to be harmless; any other difference is drift and is fixed by running
  `platform/sql/apply.sh` (as admin, with `PGHOST`, `PGUSER`, `PGSSLMODE=verify-full`, `PGSSLROOTCERT=system` set)
  after review, never by hand.
- [ ] `git add platform/evidence && git commit -m "X1 evidence: real-server role matrix" && git pull --no-rebase && git push`

## 3. Criterion 3: TLS required, plain text refused (1 minute)

- [ ] `platform/owner/check_tls.sh`
  - shows `require_secure_transport` and `ssl_min_protocol_version` from az;
  - tries a connection **without** encryption under a made-up user name (`x1_tls_probe`, no password involved): the
    server must refuse it because it is not encrypted;
  - connects as `dashboard_app` with verified TLS (asks its password) and shows the TLS version and cipher.
- [ ] Pass = `RESULT: require_secure_transport on: yes; non-TLS refused: yes; verified TLS connection works: yes`.
- [ ] Commit the evidence file as in step 2.

## 4. Criterion 5: firewall and server settings from az (1 minute)

- [ ] `platform/owner/server_evidence.sh`
  - prints region, tier, version, storage, backup retention, public access, encryption, `require_secure_transport` and
    the firewall rules, each compared with the expected values it reads from the `server-settings` table in
    `platform/README.md`. No IDs, subscription or admin name are queried.
- [ ] Pass = `RESULT: 0 difference(s) from platform/README.md`. If not 0, either the server or the README is wrong:
      hand the file over, do not edit the README to match.
- [ ] Commit the evidence file.

## 5. Criterion 4: backup restore to a scratch server, then delete it (30-60 minutes, about USD 0.03-0.06)

- [ ] Check first that no server called `omenix-pg-x1restore` exists (the script stops if it does).
- [ ] `platform/owner/restore_test.sh`
  - asks the admin name and password (hidden);
  - writes one marker row with a random token into a new table `fno.x1_restore_marker` on `omenix-pg`;
  - waits 15 minutes (Azure's log backup can lag up to about 5), then restores `omenix-pg` to 5 minutes after the
    marker as the new server `omenix-pg-x1restore` (Azure takes about 10-30 minutes);
  - Azure does not copy firewall rules to a restored server, so the script opens the scratch server to **your Mac's
    current IP only**;
  - checks the marker token and the catalog (roles, schemas, grants) on the scratch server;
  - asks you to **type the scratch server's name** and deletes it, then confirms it is gone;
  - drops the marker table on `omenix-pg`, always, even if the script stops part-way; a stop after the restore started
    prints the delete command for the scratch server (never deleted without your typed confirmation).
- [ ] Pass = `RESULT: marker restored: yes; catalog identical: yes; scratch server deleted: yes`.
- [ ] If the script stops part-way: delete the scratch server in the portal (or
      `az postgres flexible-server delete -g "$X1_RG" -n omenix-pg-x1restore --yes`) so it stops costing money. The
      marker is dropped by the script; if it says it could not, drop it as admin:
      `SET ROLE fno_owner; DROP TABLE IF EXISTS fno.x1_restore_marker;`.
- [ ] A day later: Azure portal, Cost Management, Cost analysis, filter resource `omenix-pg-x1restore`; write the
      amount into the `COST:` line of the evidence file. Commit it.

## 6. Protect the server: delete lock, failed-login and storage alerts (2 minutes)

Do this after step 5 (the lock is only on `omenix-pg`, so the restore test's scratch server can still be deleted, but
running it afterwards keeps the steps simple).

- [ ] `platform/owner/protect_server.sh`
  - adds the Azure lock `omenix-pg-no-delete` (CanNotDelete) on `omenix-pg`: deleting the server would delete all its
    backups with it, so now nobody can delete it without first removing the lock by hand. Settings can still change.
  - asks for the email address for alerts (typed at the prompt, kept only in Azure) and creates the action group
    `omenix-db-alerts`;
  - creates the metric alert `omenix-pg-failed-connections`: more than 10 failed connections in 15 minutes, checked
    every 5 minutes (`X1_FAILED_THRESHOLD=<n>` changes the 10);
  - creates the metric alert `omenix-pg-storage`: storage above 80 percent (`X1_STORAGE_THRESHOLD=<n>`), the
    mitigation for named exceptions 1 and 2 (large objects and temporary tables can fill the disk).
- [ ] What the alert can and cannot do (strong evidence, Microsoft's Flexible Server metric list): the metric
      `connections_failed` ("Failed Connections", enabled by default) counts **every** failed connection: wrong
      password, unknown user, a non-TLS attempt (step 3 makes one), a role over its connection limit. It does not say
      which user or address failed; for that, server logs would have to be sent to Log Analytics (paid, not set up).
- [ ] Pass = `RESULT: lock, action group and both alerts in place`. Azure sends a confirmation email to the address; check
      it arrived. Commit the evidence file (it holds no email address).
- [ ] To delete the server on purpose some day: `az lock delete -g "$X1_RG" --name omenix-pg-no-delete --resource omenix-pg --resource-type Microsoft.DBforPostgreSQL/flexibleServers` first.

## 7. Hand-over

- [ ] All six evidence files committed in `platform/evidence/`. Tell the orchestrator session they are there; the
      judge reads them with `platform/BUILDER_CLAIMS_X1.md`.
