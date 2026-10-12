-- X1 step 12: close large-object creation for PUBLIC in the CURRENT database, as far as the admin can.
-- apply.sh runs it in every database the admin can connect to (function rights are per database, so closing them in
-- omenix alone leaves "postgres" and the others open; closing them in template1 also closes them in databases created
-- later). PostgreSQL has no privilege for creating large objects; only EXECUTE on these three functions controls it.
-- They belong to the bootstrap superuser, so a non-superuser admin is usually refused: reported, not fatal.
-- Prints one line: what stays open in this database (named exception 1 in platform/README.md). Idempotent.
\set ON_ERROR_STOP 1
DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY['pg_catalog.lo_create(oid)', 'pg_catalog.lo_creat(integer)',
                           'pg_catalog.lo_from_bytea(oid,bytea)'] LOOP
    IF has_function_privilege('public', f, 'EXECUTE') THEN
      BEGIN
        SET LOCAL client_min_messages = error;  -- "no privileges could be revoked" is summed up below
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', f);
        SET LOCAL client_min_messages = notice;
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'database %, function %: the admin may not change its rights', current_database(), f;
      END;
    END IF;
  END LOOP;
END
$$;
SELECT format('database %s: large-object functions still open for PUBLIC: %s', current_database(),
              coalesce(string_agg(f, ', ' ORDER BY f), 'none')) AS large_objects
FROM unnest(ARRAY['lo_create(oid)', 'lo_creat(integer)', 'lo_from_bytea(oid,bytea)']) AS f
WHERE has_function_privilege('public', 'pg_catalog.' || f, 'EXECUTE');
