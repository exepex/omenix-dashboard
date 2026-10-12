-- X1 step 15: close what PostgreSQL leaves open to every role outside the omenix grants, as far as the admin can.
-- Run as the server admin connected to "omenix" (apply.sh). Idempotent.
--   * other databases: CONNECT and TEMPORARY for PUBLIC on every other database that accepts connections
--     ("postgres", "template1", and any Azure adds);
--   * large objects: EXECUTE for PUBLIC on the three functions that create them (no privilege controls creation
--     otherwise; the server-side lo_import is already closed to PUBLIC by PostgreSQL itself).
-- Each revoke is tried only while the right is still open. Where the admin may not change an object (it is not its
-- owner, e.g. a non-superuser admin and the bootstrap superuser's functions), PostgreSQL refuses or ignores the revoke;
-- that is reported, not fatal. The last query prints what is still open: each line is a named exception in
-- platform/README.md, and the role matrix reports it as OPEN. Before revoking anything from PUBLIC on a database, the
-- admin grants itself CONNECT and TEMPORARY there, so it never locks itself out.
\set ON_ERROR_STOP 1
SET client_min_messages = notice;
DO $$
DECLARE
  d text;
  f text;
BEGIN
  FOR d IN
    SELECT datname FROM pg_database
    WHERE datname <> 'omenix' AND datallowconn
      AND (has_database_privilege('public', datname, 'CONNECT') OR has_database_privilege('public', datname, 'TEMPORARY'))
    ORDER BY datname
  LOOP
    BEGIN
      SET LOCAL client_min_messages = error;  -- the "no privileges could be revoked" warnings are summed up below
      EXECUTE format('GRANT CONNECT, TEMPORARY ON DATABASE %I TO CURRENT_USER', d);
      EXECUTE format('REVOKE CONNECT, TEMPORARY ON DATABASE %I FROM PUBLIC', d);
      SET LOCAL client_min_messages = notice;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'database %: the admin may not change its rights (%)', d, SQLERRM;
    END;
  END LOOP;
  FOREACH f IN ARRAY ARRAY['pg_catalog.lo_create(oid)', 'pg_catalog.lo_creat(integer)',
                           'pg_catalog.lo_from_bytea(oid,bytea)'] LOOP
    IF has_function_privilege('public', f, 'EXECUTE') THEN
      BEGIN
        SET LOCAL client_min_messages = error;
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', f);
        SET LOCAL client_min_messages = notice;
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'function %: the admin may not change its rights (%)', f, SQLERRM;
      END;
    END IF;
  END LOOP;
END
$$;
RESET client_min_messages;

\echo 'still open for PUBLIC (each row is a named exception in platform/README.md; 0 rows = all closed):'
SELECT 'database ' || datname || ': ' || p AS still_open
FROM pg_database, unnest(ARRAY['CONNECT', 'TEMPORARY']) AS p
WHERE datname <> 'omenix' AND datallowconn AND has_database_privilege('public', datname, p)
UNION ALL
SELECT 'function ' || f || ': EXECUTE'
FROM unnest(ARRAY['pg_catalog.lo_create(oid)', 'pg_catalog.lo_creat(integer)',
                  'pg_catalog.lo_from_bytea(oid,bytea)']) AS f
WHERE has_function_privilege('public', f, 'EXECUTE')
ORDER BY 1;
