-- X1 role matrix fixtures: drop the probe tables (and their sequences) and functions. Run as the server admin connected to "omenix".
\set ON_ERROR_STOP 1
BEGIN;
SET ROLE stock_owner;
DROP TABLE IF EXISTS stock.x1_probe;
DROP FUNCTION IF EXISTS stock.x1_probe_f();
SET ROLE fno_owner;
DROP TABLE IF EXISTS fno.x1_probe;
DROP FUNCTION IF EXISTS fno.x1_probe_f();
SET ROLE app_owner;
DROP TABLE IF EXISTS app.x1_probe;
DROP FUNCTION IF EXISTS app.x1_probe_f();
RESET ROLE;
COMMIT;
