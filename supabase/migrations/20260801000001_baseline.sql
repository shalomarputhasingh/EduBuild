-- 0001_baseline
--
-- The schema as it existed when Sequelize owned it via sync().
-- Reproduced here so migrations are the single source of truth from now on.
--
-- Enum type names follow Sequelize's convention (enum_<table>_<column>) so an
-- existing database created by sync() matches this file exactly and later
-- migrations apply cleanly to both a fresh and a pre-existing database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE enum_edubuild_users_role AS ENUM ('student', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Quoted to preserve the capital L, matching the identifier Sequelize generates.
-- Unquoted, Postgres would fold this to ...classlevel and the column below
-- would then reference a type that does not exist.
DO $$ BEGIN
  CREATE TYPE "enum_edubuild_projects_classLevel" AS ENUM ('6-8', '9-10', '11-12');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_edubuild_projects_subject AS ENUM
    ('Physics', 'Chemistry', 'Biology', 'Mathematics', 'Engineering');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_edubuild_projects_difficulty AS ENUM ('Easy', 'Medium', 'Hard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_edubuild_projects_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_edubuild_feedbacks_difficulty AS ENUM ('Easy', 'Medium', 'Hard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edubuild_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        enum_edubuild_users_role NOT NULL DEFAULT 'student',
  school      VARCHAR(255) DEFAULT '',
  state       VARCHAR(255) DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Projects ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edubuild_projects (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              VARCHAR(255) NOT NULL,
  description        TEXT NOT NULL,
  image              VARCHAR(255) DEFAULT '',
  budget             DOUBLE PRECISION NOT NULL,
  "classLevel"       "enum_edubuild_projects_classLevel" NOT NULL,
  subject            enum_edubuild_projects_subject NOT NULL,
  materials          JSONB DEFAULT '[]'::jsonb,
  steps              JSONB DEFAULT '[]'::jsonb,
  "learningOutcomes" JSONB DEFAULT '[]'::jsonb,
  difficulty         enum_edubuild_projects_difficulty DEFAULT 'Medium',
  rating             DOUBLE PRECISION DEFAULT 0,
  "createdBy"        UUID,
  "videoUrl"         VARCHAR(255) DEFAULT '',
  status             enum_edubuild_projects_status DEFAULT 'pending',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Feedback ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edubuild_feedbacks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId"  UUID NOT NULL,
  "userId"     UUID NOT NULL,
  "userName"   VARCHAR(255) NOT NULL,
  "schoolName" VARCHAR(255) DEFAULT '',
  difficulty   enum_edubuild_feedbacks_difficulty,
  feedback     TEXT,
  rating       INTEGER,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
