# Response 16: issue #3, can named exceptions 1 and 2 be closed? (builder's claims)

The dated finding is in `platform/README.md`, under "Named exceptions": "Can exceptions 1 and 2 be closed? (issue
#3, checked 13 Oct 2026)". Nothing was run on the server.

| Claim | Evidence | Confidence |
|---|---|---|
| Exception 1 (large objects) cannot be closed by any supported route today, nor by upgrading to PostgreSQL 18. | PostgreSQL 18 docs (`lo-implementation`, `lo-interfaces`, `lo-funcs`): privileges exist only for reading, writing and owner actions; creation needs none. The PostgreSQL 18 release notes' two large-object items (`has_largeobject_privilege()`, `ALTER DEFAULT PRIVILEGES … ON LARGE OBJECTS`) govern read and write rights, not creation. `lo_compat_privileges` only relaxes checks and is superuser-only. | strong evidence (PostgreSQL) |
| Azure offers no documented server parameter or support route to revoke `EXECUTE` on the bootstrap superuser's functions. | Azure's access-control page (2026-07-14) and server-concepts page (2026-07-08): the admin is "not part of the azuresu role"; `azure_pg_admin` "doesn't have full superuser permissions"; no revoke or support route is mentioned. | some evidence (docs silent, not explicit) |
| Exception 2 may already be closed in practice for Azure's own databases. It is now measured rather than assumed. | Azure: "azure_maintenance … You don't have access to this database". Yet its access list grants PUBLIC CONNECT, and the admin connected in step 1. `tests/large_objects.sh` now reports a database the server refuses to the (plain) monitor role at connection as `CLOSED`, not as a failure. Before this change, such a refusal would have made the scheduled check alert forever, a latent false alarm. | strong evidence for the mechanism (local `pg_hba` reject: `CLOSED database template1`, exit 0; fake-psql test: an Azure-style refusal gives CLOSED, a timeout still gives FAIL, no IP printed); the Azure outcome waits on the monitor's first run |
| Optional route for exception 1: a support request text is given in the README (Microsoft to run the `REVOKE` as superuser in every database). | If done, `12_large_objects.sql` reports "none" and the matrix's OPEN count falls by 3 per role. No code change is needed. | reasoning only (Microsoft's answer unknown) |

Tests: `tests/owner_scripts_test.sh` adds 3 checks (CLOSED, FAIL, no IP), passing on bash 5 and 3.2. `ci.sh`,
code-size and the web checks pass.
