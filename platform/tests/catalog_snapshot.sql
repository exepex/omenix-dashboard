-- X1: a normalised, sorted listing of everything the setup controls: the seven roles' attributes, settings and
-- memberships, the database's owner and privileges, the four schemas' owners and privileges, and the default
-- privileges. Run as the server admin connected to "omenix" (psql -X -A -t -f). The admin's own name prints as
-- <admin> and any superuser (the bootstrap one on Azure is not ours) as <superuser>, so the output of a local copy and
-- of the real server can be compared line by line with expected_catalog.txt. Reads catalogs only; no secrets.
WITH ours(name) AS (
  VALUES ('stock_owner'), ('fno_owner'), ('app_owner'),
         ('stock_writer'), ('fno_writer'), ('dashboard_app'), ('stock_inbox_reader')
),
who AS (  -- display name of a role oid
  SELECT oid,
         CASE WHEN rolname = current_user THEN '<admin>'
              WHEN rolsuper THEN '<superuser>'
              ELSE rolname END AS name
  FROM pg_roles
),
acl_lines AS (  -- (object, grantee, privilege, grantable, grantor) for every ACL item we care about
  SELECT 'database omenix' AS obj, a.*
  FROM pg_database d, aclexplode(d.datacl) a WHERE d.datname = 'omenix'
  UNION ALL
  SELECT 'schema ' || n.nspname, a.*
  FROM pg_namespace n, aclexplode(n.nspacl) a WHERE n.nspname IN ('public', 'stock', 'fno', 'app')
  UNION ALL
  SELECT 'default ' || CASE d.defaclobjtype WHEN 'r' THEN 'tables' WHEN 'S' THEN 'sequences'
                            WHEN 'f' THEN 'functions' WHEN 'T' THEN 'types' WHEN 'n' THEN 'schemas' END
         || ' by ' || (SELECT name FROM who WHERE oid = d.defaclrole)
         || ' in ' || coalesce(n.nspname, '(all schemas)'), a.*
  FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace, aclexplode(d.defaclacl) a
  WHERE d.defaclrole IN (SELECT oid FROM pg_roles WHERE rolname IN (SELECT name FROM ours))
),
lines AS (
  SELECT format('role %s: login=%s inherit=%s superuser=%s createdb=%s createrole=%s replication=%s bypassrls=%s connlimit=%s valid_until=%s',
                r.rolname, r.rolcanlogin, r.rolinherit, r.rolsuper, r.rolcreatedb, r.rolcreaterole,
                r.rolreplication, r.rolbypassrls, r.rolconnlimit, coalesce(r.rolvaliduntil::text, 'never')) AS line
  FROM pg_roles r WHERE r.rolname IN (SELECT name FROM ours)
  UNION ALL
  SELECT format('role setting %s in %s: %s', r.rolname, coalesce(d.datname, '(all databases)'), s.setting)
  FROM pg_db_role_setting rs
  JOIN pg_roles r ON r.oid = rs.setrole
  LEFT JOIN pg_database d ON d.oid = rs.setdatabase,
  unnest(rs.setconfig) s(setting)
  WHERE r.rolname IN (SELECT name FROM ours)
  UNION ALL
  SELECT format('member %s in %s: admin=%s inherit=%s set=%s grantor=%s',
                m.name, g.name, a.admin_option, a.inherit_option, a.set_option, gr.name)
  FROM pg_auth_members a
  JOIN who g ON g.oid = a.roleid
  JOIN who m ON m.oid = a.member
  JOIN who gr ON gr.oid = a.grantor
  WHERE a.roleid IN (SELECT oid FROM pg_roles WHERE rolname IN (SELECT name FROM ours))
     OR a.member IN (SELECT oid FROM pg_roles WHERE rolname IN (SELECT name FROM ours))
  UNION ALL
  SELECT format('owner database omenix: %s', w.name)
  FROM pg_database d JOIN who w ON w.oid = d.datdba WHERE d.datname = 'omenix'
  UNION ALL
  SELECT format('owner schema %s: %s', n.nspname, w.name)
  FROM pg_namespace n JOIN who w ON w.oid = n.nspowner WHERE n.nspname IN ('public', 'stock', 'fno', 'app')
  UNION ALL
  SELECT format('acl %s: %s %s%s granted by %s', l.obj,
                CASE WHEN l.grantee = 0 THEN 'PUBLIC' ELSE (SELECT name FROM who WHERE oid = l.grantee) END,
                l.privilege_type, CASE WHEN l.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END,
                (SELECT name FROM who WHERE oid = l.grantor))
  FROM acl_lines l
)
SELECT line FROM lines ORDER BY line COLLATE "C";
