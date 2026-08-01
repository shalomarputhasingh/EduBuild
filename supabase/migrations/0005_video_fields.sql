-- 0005_video_fields
--
-- Normalized YouTube metadata, resolved server-side through the keyless oEmbed
-- endpoint. `videoUrl` already exists and keeps holding the original pasted URL.

DO $$ BEGIN
  CREATE TYPE enum_edubuild_projects_videoSource AS ENUM ('manual', 'youtube_search', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE edubuild_projects
  ADD COLUMN IF NOT EXISTS "videoId"        VARCHAR(16),
  ADD COLUMN IF NOT EXISTS "videoTitle"     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "videoThumbnail" VARCHAR(512),
  ADD COLUMN IF NOT EXISTS "videoChannel"   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "videoSource"    enum_edubuild_projects_videoSource DEFAULT 'none';

-- YouTube IDs are exactly 11 characters from a fixed alphabet. Rejecting anything
-- else here means the embed URL built from this column can never be malformed.
ALTER TABLE edubuild_projects
  DROP CONSTRAINT IF EXISTS edubuild_projects_video_id_format;
ALTER TABLE edubuild_projects
  ADD CONSTRAINT edubuild_projects_video_id_format
  CHECK ("videoId" IS NULL OR "videoId" ~ '^[A-Za-z0-9_-]{11}$');

-- Mark projects that already have a URL as manually attached, so existing videos
-- keep working. Their metadata is resolved lazily the next time they are saved.
UPDATE edubuild_projects
SET "videoSource" = 'manual'
WHERE "videoUrl" IS NOT NULL
  AND trim("videoUrl") <> ''
  AND "videoSource" = 'none';

COMMENT ON COLUMN edubuild_projects."videoSource" IS
  'How the video was attached. "youtube_search" is reserved for the optional, not-yet-enabled search feature.';
