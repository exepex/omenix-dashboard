-- X1 step 20: schemas stock, fno and app, each owned by its owner role; no CREATE in "public" for anyone but its
-- owner (pg_database_owner). Run as the server admin connected to "omenix". Idempotent.
\set ON_ERROR_STOP 1
BEGIN;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

CREATE SCHEMA IF NOT EXISTS stock AUTHORIZATION stock_owner;
CREATE SCHEMA IF NOT EXISTS fno AUTHORIZATION fno_owner;
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION app_owner;
-- Converge the owner if a schema already existed with another one.
ALTER SCHEMA stock OWNER TO stock_owner;
ALTER SCHEMA fno OWNER TO fno_owner;
ALTER SCHEMA app OWNER TO app_owner;
COMMIT;
