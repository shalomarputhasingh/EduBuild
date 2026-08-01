-- 0006_search_indexes
--
-- Indexes for the backend listing endpoint. Before this, every library page load
-- was a sequential scan over the whole table.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- The default listing: approved projects, newest first. Composite so the filter
-- and the sort are both served by one index.
CREATE INDEX IF NOT EXISTS idx_projects_status_created
  ON edubuild_projects (status, "createdAt" DESC);

-- Individual filter columns.
CREATE INDEX IF NOT EXISTS idx_projects_subject     ON edubuild_projects (subject);
CREATE INDEX IF NOT EXISTS idx_projects_class_level ON edubuild_projects ("classLevel");
CREATE INDEX IF NOT EXISTS idx_projects_difficulty  ON edubuild_projects (difficulty);
CREATE INDEX IF NOT EXISTS idx_projects_budget      ON edubuild_projects (budget);

-- "My submissions" on the dashboard.
CREATE INDEX IF NOT EXISTS idx_projects_created_by
  ON edubuild_projects ("createdBy") WHERE "createdBy" IS NOT NULL;

-- Feedback lookups by project.
CREATE INDEX IF NOT EXISTS idx_feedbacks_project ON edubuild_feedbacks ("projectId");

-- Containment queries against the tag and material arrays.
CREATE INDEX IF NOT EXISTS idx_projects_tags      ON edubuild_projects USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_projects_materials ON edubuild_projects USING GIN (materials);

-- Trigram indexes so the ILIKE '%term%' text search is not a sequential scan.
-- A leading wildcard cannot use a btree index, which is what pg_trgm solves.
CREATE INDEX IF NOT EXISTS idx_projects_title_trgm
  ON edubuild_projects USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_summary_trgm
  ON edubuild_projects USING GIN (summary gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_concept_trgm
  ON edubuild_projects USING GIN (concept gin_trgm_ops);

-- If the corpus grows past a few thousand rows, the upgrade path is a stored
-- tsvector column with a GIN index and websearch_to_tsquery, replacing ILIKE.
-- Trigram search is the right amount of machinery at the current scale.
