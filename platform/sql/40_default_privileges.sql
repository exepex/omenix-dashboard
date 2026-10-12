-- X1 step 40: default privileges, so every table and sequence an owner role creates later in its schema is readable
-- or writable by exactly the runtime roles below. Run as the server admin connected to "omenix". Idempotent: each
-- owner's defaults (global and in its schema) are first revoked from every other Omenix role and PUBLIC, then granted
-- again.
-- Defaults apply only to objects created BY the owner role (log in as it, or SET ROLE to it); a table created by the
-- admin itself gets none of these grants.
\set ON_ERROR_STOP 1
BEGIN;

SET ROLE stock_owner;
-- No defaults outside the schema (an entry without IN SCHEMA would apply to every schema).
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES
  FROM PUBLIC, fno_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES
  FROM PUBLIC, fno_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA stock REVOKE ALL ON TABLES
  FROM PUBLIC, fno_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA stock REVOKE ALL ON SEQUENCES
  FROM PUBLIC, fno_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA stock GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO stock_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA stock GRANT USAGE, SELECT ON SEQUENCES TO stock_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA stock GRANT SELECT ON TABLES TO dashboard_app;
RESET ROLE;

SET ROLE fno_owner;
-- No defaults outside the schema (an entry without IN SCHEMA would apply to every schema).
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES
  FROM PUBLIC, stock_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES
  FROM PUBLIC, stock_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA fno REVOKE ALL ON TABLES
  FROM PUBLIC, stock_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA fno REVOKE ALL ON SEQUENCES
  FROM PUBLIC, stock_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA fno GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO fno_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA fno GRANT USAGE, SELECT ON SEQUENCES TO fno_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA fno GRANT SELECT ON TABLES TO dashboard_app;
RESET ROLE;

SET ROLE app_owner;
-- No defaults outside the schema (an entry without IN SCHEMA would apply to every schema).
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES
  FROM PUBLIC, stock_owner, fno_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES
  FROM PUBLIC, stock_owner, fno_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES
  FROM PUBLIC, stock_owner, fno_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON SEQUENCES
  FROM PUBLIC, stock_owner, fno_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT, INSERT, UPDATE ON TABLES TO dashboard_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT USAGE, SELECT ON SEQUENCES TO dashboard_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT ON TABLES TO stock_inbox_reader;
RESET ROLE;

COMMIT;
