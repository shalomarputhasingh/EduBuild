-- 0007_drop_legacy_tables
--
-- Removes the capitalized "Users", "Projects" and "Feedback" tables.
--
-- These were created by an earlier sequelize.sync() run before the models were
-- given explicit tableName values, leaving two parallel sets of tables in the
-- same schema. Only the edubuild_* tables have ever been read or written by the
-- application; the capitalized ones have been dead since that rename.
--
-- ─── BEFORE RUNNING THIS ─────────────────────────────────────────────────────
-- Dropping a table is irreversible. Take a Supabase snapshot first, then confirm
-- these tables hold nothing you need:
--
--   SELECT count(*) FROM "Users";
--   SELECT count(*) FROM "Projects";
--   SELECT count(*) FROM "Feedback";
--
-- If any of them contains real data, do not apply this migration — migrate the
-- rows into the edubuild_* tables first.
--
-- On a fresh Supabase project these tables do not exist and this is a no-op.

DROP TABLE IF EXISTS "Feedback" CASCADE;
DROP TABLE IF EXISTS "Projects" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- Their enum types go with them, if nothing else depends on them.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'enum_Users_role',
    'enum_Projects_classLevel',
    'enum_Projects_subject',
    'enum_Projects_difficulty',
    'enum_Projects_status',
    'enum_Feedback_difficulty'
  ] LOOP
    BEGIN
      EXECUTE format('DROP TYPE IF EXISTS %I', t);
    EXCEPTION WHEN dependent_objects_still_exist THEN
      RAISE NOTICE 'Type % still in use, leaving it alone', t;
    END;
  END LOOP;
END $$;
