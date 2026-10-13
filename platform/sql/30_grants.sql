-- X1 step 30: schema USAGE, granted by each schema's owner role to exactly the runtime roles that need it.
-- Run as the server admin connected to "omenix" (it switches to each owner role with SET ROLE). Idempotent: each
-- schema's grants are first revoked from every other Omenix role and PUBLIC, then granted again.
\set ON_ERROR_STOP 1
BEGIN;

SET ROLE stock_owner;
REVOKE ALL ON SCHEMA stock
  FROM PUBLIC, fno_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader, db_monitor;
GRANT USAGE ON SCHEMA stock TO stock_writer, dashboard_app;
RESET ROLE;

SET ROLE fno_owner;
REVOKE ALL ON SCHEMA fno
  FROM PUBLIC, stock_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader, db_monitor;
GRANT USAGE ON SCHEMA fno TO fno_writer, dashboard_app;
RESET ROLE;

SET ROLE app_owner;
REVOKE ALL ON SCHEMA app
  FROM PUBLIC, stock_owner, fno_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader, db_monitor;
GRANT USAGE ON SCHEMA app TO dashboard_app, stock_inbox_reader;
RESET ROLE;

COMMIT;
