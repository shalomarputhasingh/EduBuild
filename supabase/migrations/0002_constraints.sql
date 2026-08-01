-- 0002_constraints
--
-- Adds the referential integrity that never existed under sync().
--
-- Orphan rows are cleaned up first: the original schema had no foreign keys, so
-- deleting a user or project left its projects and feedback pointing at nothing.
-- Adding the constraints without this cleanup would fail on any real database.

-- ─── Clean up orphans ────────────────────────────────────────────────────────
UPDATE edubuild_projects
SET "createdBy" = NULL
WHERE "createdBy" IS NOT NULL
  AND "createdBy" NOT IN (SELECT id FROM edubuild_users);

DELETE FROM edubuild_feedbacks
WHERE "projectId" NOT IN (SELECT id FROM edubuild_projects)
   OR "userId" NOT IN (SELECT id FROM edubuild_users);

-- ─── Foreign keys ────────────────────────────────────────────────────────────
-- A deleted author leaves their published guides in place, unattributed, rather
-- than removing content other teachers may be relying on.
ALTER TABLE edubuild_projects
  DROP CONSTRAINT IF EXISTS edubuild_projects_created_by_fkey;
ALTER TABLE edubuild_projects
  ADD CONSTRAINT edubuild_projects_created_by_fkey
  FOREIGN KEY ("createdBy") REFERENCES edubuild_users(id) ON DELETE SET NULL;

-- Feedback has no meaning without its project or author, so it cascades.
ALTER TABLE edubuild_feedbacks
  DROP CONSTRAINT IF EXISTS edubuild_feedbacks_project_id_fkey;
ALTER TABLE edubuild_feedbacks
  ADD CONSTRAINT edubuild_feedbacks_project_id_fkey
  FOREIGN KEY ("projectId") REFERENCES edubuild_projects(id) ON DELETE CASCADE;

ALTER TABLE edubuild_feedbacks
  DROP CONSTRAINT IF EXISTS edubuild_feedbacks_user_id_fkey;
ALTER TABLE edubuild_feedbacks
  ADD CONSTRAINT edubuild_feedbacks_user_id_fkey
  FOREIGN KEY ("userId") REFERENCES edubuild_users(id) ON DELETE CASCADE;

-- ─── One rating per user per project ─────────────────────────────────────────
-- Deduplicate first, keeping each user's most recent review.
DELETE FROM edubuild_feedbacks a
USING edubuild_feedbacks b
WHERE a."projectId" = b."projectId"
  AND a."userId" = b."userId"
  AND (a."createdAt" < b."createdAt"
       OR (a."createdAt" = b."createdAt" AND a.id < b.id));

ALTER TABLE edubuild_feedbacks
  DROP CONSTRAINT IF EXISTS edubuild_feedbacks_project_user_unique;
ALTER TABLE edubuild_feedbacks
  ADD CONSTRAINT edubuild_feedbacks_project_user_unique
  UNIQUE ("projectId", "userId");

-- ─── Value constraints ───────────────────────────────────────────────────────
ALTER TABLE edubuild_feedbacks
  DROP CONSTRAINT IF EXISTS edubuild_feedbacks_rating_range;
ALTER TABLE edubuild_feedbacks
  ADD CONSTRAINT edubuild_feedbacks_rating_range
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

ALTER TABLE edubuild_projects
  DROP CONSTRAINT IF EXISTS edubuild_projects_budget_non_negative;
ALTER TABLE edubuild_projects
  ADD CONSTRAINT edubuild_projects_budget_non_negative
  CHECK (budget >= 0);

ALTER TABLE edubuild_projects
  DROP CONSTRAINT IF EXISTS edubuild_projects_rating_range;
ALTER TABLE edubuild_projects
  ADD CONSTRAINT edubuild_projects_rating_range
  CHECK (rating >= 0 AND rating <= 5);
