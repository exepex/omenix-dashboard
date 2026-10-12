-- X1 step 00: the seven Omenix roles, their attributes and settings, and the admin's SET-only membership in the
-- three owner roles. Idempotent: creates what is missing and converges what exists to the declared state.
-- Run as the server admin (on Azure: the Flexible Server admin, a non-superuser with CREATEDB and CREATEROLE),
-- connected to any database (apply.sh uses "postgres"). Never sets or changes a password.
-- Same effect as exepex/trading docs/migration/azure_setup.sql at a8cdad4 (vendored in reference/azure_setup.sql).
\set ON_ERROR_STOP 1
BEGIN;

DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['stock_owner', 'fno_owner', 'app_owner',
                           'stock_writer', 'fno_writer', 'dashboard_app', 'stock_inbox_reader'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('CREATE ROLE %I', r);
    END IF;
  END LOOP;
END
$$;

-- Owner roles: create and change tables. Used only to run migrations by hand, never by a running app or routine.
ALTER ROLE stock_owner        LOGIN INHERIT NOCREATEDB NOCREATEROLE CONNECTION LIMIT -1;
ALTER ROLE fno_owner          LOGIN INHERIT NOCREATEDB NOCREATEROLE CONNECTION LIMIT -1;
ALTER ROLE app_owner          LOGIN INHERIT NOCREATEDB NOCREATEROLE CONNECTION LIMIT -1;

-- Runtime roles: what the apps and routines use.
ALTER ROLE stock_writer       LOGIN INHERIT NOCREATEDB NOCREATEROLE CONNECTION LIMIT 5;   -- stock routines: write the stock read models
ALTER ROLE fno_writer         LOGIN INHERIT NOCREATEDB NOCREATEROLE CONNECTION LIMIT 5;   -- F&O routine: write the F&O read models
ALTER ROLE dashboard_app      LOGIN INHERIT NOCREATEDB NOCREATEROLE CONNECTION LIMIT 20;  -- the dashboard: read stock and fno, write its own app tables
ALTER ROLE stock_inbox_reader LOGIN INHERIT NOCREATEDB NOCREATEROLE CONNECTION LIMIT 5;   -- stock routines: read the dashboard inbox

-- Role settings: exactly these, nothing else (RESET ALL clears settings made for all databases).
ALTER ROLE stock_owner        RESET ALL;
ALTER ROLE fno_owner          RESET ALL;
ALTER ROLE app_owner          RESET ALL;
ALTER ROLE stock_writer       RESET ALL;
ALTER ROLE fno_writer         RESET ALL;
ALTER ROLE dashboard_app      RESET ALL;
ALTER ROLE stock_inbox_reader RESET ALL;
ALTER ROLE stock_writer       SET statement_timeout = '60s';
ALTER ROLE fno_writer         SET statement_timeout = '60s';
ALTER ROLE dashboard_app      SET statement_timeout = '15s';
ALTER ROLE stock_inbox_reader SET statement_timeout = '30s';

-- SUPERUSER, REPLICATION and BYPASSRLS can be changed only by a superuser, which the Azure admin is not; so they are
-- asserted, not set. A role with any of them stops the run.
DO $$
DECLARE
  bad text;
BEGIN
  SELECT string_agg(rolname, ', ' ORDER BY rolname) INTO bad
  FROM pg_roles
  WHERE rolname IN ('stock_owner', 'fno_owner', 'app_owner',
                    'stock_writer', 'fno_writer', 'dashboard_app', 'stock_inbox_reader')
    AND (rolsuper OR rolreplication OR rolbypassrls);
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'roles with SUPERUSER, REPLICATION or BYPASSRLS (fix by hand as a superuser): %', bad;
  END IF;
END
$$;

-- No Omenix role is a member of any role, and no role but the admin is a member of an Omenix role. This setup never
-- grants such memberships, so on a correct server nothing is revoked; any found are drift and are removed.
DO $$
DECLARE
  m record;
BEGIN
  FOR m IN
    SELECT r.rolname AS role_name, mem.rolname AS member_name, g.rolname AS grantor_name
    FROM pg_auth_members a
    JOIN pg_roles r ON r.oid = a.roleid
    JOIN pg_roles mem ON mem.oid = a.member
    JOIN pg_roles g ON g.oid = a.grantor
    WHERE mem.rolname IN ('stock_owner', 'fno_owner', 'app_owner',
                          'stock_writer', 'fno_writer', 'dashboard_app', 'stock_inbox_reader')
       OR (r.rolname IN ('stock_owner', 'fno_owner', 'app_owner',
                         'stock_writer', 'fno_writer', 'dashboard_app', 'stock_inbox_reader')
           AND mem.rolname <> current_user)
  LOOP
    RAISE NOTICE 'revoking drift: % from % (granted by %)', m.role_name, m.member_name, m.grantor_name;
    EXECUTE format('REVOKE %I FROM %I GRANTED BY %I', m.role_name, m.member_name, m.grantor_name);
  END LOOP;
END
$$;

-- Let the admin act as each owner role (needed to create their schemas), without inheriting their rights.
-- Re-running updates the options of the admin's own grant if they drifted.
GRANT stock_owner, fno_owner, app_owner TO CURRENT_USER WITH INHERIT FALSE, SET TRUE;

COMMIT;
