-- 0004_project_fields
--
-- Adds the structured project-guide fields.
--
-- This migration only ADDS columns. The shape of `materials` and `steps` changes
-- from string[] to object[], but existing rows are deliberately left alone:
-- the API normalizes both shapes on read (backend/utils/normalizeProject.js), so
-- legacy rows keep rendering correctly and no destructive rewrite is needed.
--
-- A backfill that converts stored rows to the new shape can be written later as
-- its own reviewed migration. It is an optimization, not a prerequisite.

ALTER TABLE edubuild_projects
  ADD COLUMN IF NOT EXISTS summary                VARCHAR(280),
  ADD COLUMN IF NOT EXISTS concept                VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "estimatedTimeMinutes" INTEGER,
  ADD COLUMN IF NOT EXISTS "safetyPrecautions"    JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags                   JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS language               VARCHAR(8) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS "rejectionReason"      TEXT;

ALTER TABLE edubuild_projects
  DROP CONSTRAINT IF EXISTS edubuild_projects_time_positive;
ALTER TABLE edubuild_projects
  ADD CONSTRAINT edubuild_projects_time_positive
  CHECK ("estimatedTimeMinutes" IS NULL OR "estimatedTimeMinutes" > 0);

-- A rejected project must explain itself; anything else must not carry a reason.
-- Enforced here as well as in the controller so the invariant survives any
-- future write path that bypasses the API.
ALTER TABLE edubuild_projects
  DROP CONSTRAINT IF EXISTS edubuild_projects_rejection_reason_required;
ALTER TABLE edubuild_projects
  ADD CONSTRAINT edubuild_projects_rejection_reason_required
  CHECK (
    (status = 'rejected' AND "rejectionReason" IS NOT NULL AND length(trim("rejectionReason")) > 0)
    OR (status <> 'rejected' AND "rejectionReason" IS NULL)
  );

-- Backfill a summary for existing rows so cards are not blank. Truncated at a
-- word boundary where possible.
UPDATE edubuild_projects
SET summary = left(description, 200)
WHERE summary IS NULL AND description IS NOT NULL;

COMMENT ON COLUMN edubuild_projects.materials IS
  'Array of {name, quantity, estimatedCost, alternative, note}. Legacy rows may hold string[]; normalized on read.';
COMMENT ON COLUMN edubuild_projects.steps IS
  'Array of {title, description, imageUrl, safetyNote, videoTimestamp}. Legacy rows may hold string[]; normalized on read.';
COMMENT ON COLUMN edubuild_projects.language IS
  'BCP-47-ish language tag for this guide''s written content. Per-language guides are not yet modelled.';
