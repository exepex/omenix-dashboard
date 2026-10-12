-- X1 role matrix fixtures: one probe table (with a sequence) per schema, created BY each owner role so the default
-- privileges of 40_default_privileges.sql are what grants the runtime roles their access (nothing is granted here).
-- Run as the server admin connected to "omenix". Idempotent. Removed again by fixtures_down.sql.
\set ON_ERROR_STOP 1
BEGIN;
SET ROLE stock_owner;
CREATE TABLE IF NOT EXISTS stock.x1_probe (id bigserial PRIMARY KEY, note text);
SET ROLE fno_owner;
CREATE TABLE IF NOT EXISTS fno.x1_probe (id bigserial PRIMARY KEY, note text);
SET ROLE app_owner;
CREATE TABLE IF NOT EXISTS app.x1_probe (id bigserial PRIMARY KEY, note text);
RESET ROLE;
COMMIT;
