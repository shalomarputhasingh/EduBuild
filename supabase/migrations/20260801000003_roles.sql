-- 0003_roles
--
-- Collapses the role model to exactly two roles: 'user' and 'admin'.
--
-- A 'user' is the creator/publisher of project guides — a teacher, in product
-- copy. The old 'student' value is renamed rather than kept alongside, so there
-- is never more than one non-admin role to reason about in an authorization check.
--
-- Postgres cannot remove a value from an enum in place, so this creates a new
-- type, migrates the column, and drops the old one. The whole sequence runs in a
-- single transaction: if any step fails, the column is left untouched.

BEGIN;

-- 1. New type with only the values we intend to keep.
DO $$ BEGIN
  CREATE TYPE enum_edubuild_users_role_new AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Drop the default before the cast — it still references the old type.
ALTER TABLE edubuild_users ALTER COLUMN role DROP DEFAULT;

-- 3. Move the column across, folding 'student' into 'user'.
--    Anything unrecognized also becomes 'user', which is the least-privileged
--    outcome; this can only ever remove access, never grant it.
ALTER TABLE edubuild_users
  ALTER COLUMN role TYPE enum_edubuild_users_role_new
  USING (
    CASE role::text
      WHEN 'admin' THEN 'admin'
      ELSE 'user'
    END
  )::enum_edubuild_users_role_new;

-- 4. Restore the default under the new type.
ALTER TABLE edubuild_users ALTER COLUMN role SET DEFAULT 'user';

-- 5. Retire the old type and take its name, so the model and any later
--    migration can refer to enum_edubuild_users_role as before.
DROP TYPE enum_edubuild_users_role;
ALTER TYPE enum_edubuild_users_role_new RENAME TO enum_edubuild_users_role;

COMMIT;

-- Verify with:
--   SELECT role, count(*) FROM edubuild_users GROUP BY role;
-- Expected: only 'user' and 'admin'.
