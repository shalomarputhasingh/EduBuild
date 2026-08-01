-- 0008_ai_provider_settings
--
-- Lets an admin configure AI providers from the app instead of redeploying
-- with new environment variables.
--
-- SECURITY NOTES
--   * "apiKeyEncrypted" holds AES-256-GCM ciphertext, never a raw key. The
--     encryption key lives in SETTINGS_ENCRYPTION_KEY, outside the database, so
--     a database dump alone does not yield usable provider credentials.
--   * "apiKeyHint" is a masked preview (sk-pro••••••9f2a) shown in the UI so an
--     admin can tell which key is set. It is not enough to authenticate with.
--   * The API never returns the decrypted key to any client. It is decrypted
--     only in-process, immediately before an outbound provider call.

CREATE TABLE IF NOT EXISTS edubuild_ai_providers (
  provider          VARCHAR(32) PRIMARY KEY,
  "apiKeyEncrypted" TEXT,
  "apiKeyHint"      VARCHAR(64),
  model             VARCHAR(160),
  "isActive"        BOOLEAN NOT NULL DEFAULT false,
  "updatedBy"       UUID REFERENCES edubuild_users(id) ON DELETE SET NULL,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only providers the code actually implements.
ALTER TABLE edubuild_ai_providers
  DROP CONSTRAINT IF EXISTS edubuild_ai_providers_known;
ALTER TABLE edubuild_ai_providers
  ADD CONSTRAINT edubuild_ai_providers_known
  CHECK (provider IN ('gemini', 'openai', 'groq', 'openrouter', 'mock'));

-- At most one active provider, enforced by the database rather than by
-- application code remembering to clear the previous one.
DROP INDEX IF EXISTS idx_ai_providers_single_active;
CREATE UNIQUE INDEX idx_ai_providers_single_active
  ON edubuild_ai_providers (("isActive"))
  WHERE "isActive";

COMMENT ON TABLE edubuild_ai_providers IS
  'Admin-managed AI provider configuration. API keys are encrypted at rest and never returned to a client.';
COMMENT ON COLUMN edubuild_ai_providers."apiKeyEncrypted" IS
  'AES-256-GCM ciphertext as iv.authTag.ciphertext (base64). Decryptable only with SETTINGS_ENCRYPTION_KEY.';
COMMENT ON COLUMN edubuild_ai_providers.model IS
  'Model id chosen from the provider''s live catalogue. NULL means use the provider default.';
