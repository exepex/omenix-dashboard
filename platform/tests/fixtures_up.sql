-- X1 role matrix fixtures: one probe table (with a sequence) and one function per schema, created BY each owner role so the default
-- privileges of 40_default_privileges.sql are what grants the runtime roles their access (nothing is granted here).
-- Run as the server admin connected to "omenix". Idempotent. Removed again by fixtures_down.sql.
\set ON_ERROR_STOP 1
BEGIN;
SET ROLE stock_owner;
CREATE TABLE IF NOT EXISTS stock.x1_probe (id bigserial PRIMARY KEY, note text);
CREATE OR REPLACE FUNCTION stock.x1_probe_f() RETURNS int LANGUAGE sql AS 'SELECT 1';
SET ROLE fno_owner;
CREATE TABLE IF NOT EXISTS fno.x1_probe (id bigserial PRIMARY KEY, note text);
CREATE OR REPLACE FUNCTION fno.x1_probe_f() RETURNS int LANGUAGE sql AS 'SELECT 1';
SET ROLE app_owner;
CREATE TABLE IF NOT EXISTS app.x1_probe (id bigserial PRIMARY KEY, note text);
CREATE OR REPLACE FUNCTION app.x1_probe_f() RETURNS int LANGUAGE sql AS 'SELECT 1';
RESET ROLE;
COMMIT;
