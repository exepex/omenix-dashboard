-- X1 step 10: database "omenix"; only the seven Omenix roles may connect, nobody gets TEMP or CREATE on it.
-- Run as the server admin connected to "postgres" (CREATE DATABASE cannot run inside a transaction or a DO block,
-- so it is issued through \gexec only when missing). Idempotent.
\set ON_ERROR_STOP 1
SELECT 'CREATE DATABASE omenix' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'omenix') \gexec

BEGIN;
-- Nobody gets anything by default; the revoke list also clears any drift on the seven roles.
REVOKE ALL ON DATABASE omenix
  FROM PUBLIC, stock_owner, fno_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
GRANT CONNECT ON DATABASE omenix
  TO stock_owner, fno_owner, app_owner, stock_writer, fno_writer, dashboard_app, stock_inbox_reader;
COMMIT;
