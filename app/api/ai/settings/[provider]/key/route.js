import { requireAdmin } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseBody, parseParams } from '@/lib/api/input';
import { saveApiKey, clearApiKey } from '@/lib/services/ai/settingsStore';
import { testProvider } from '@/lib/services/ai';
import { isEncryptionAvailable } from '@/lib/utils/crypto';
import { providerParam, apiKeySchema } from '@/lib/schemas/aiSettingsSchemas';
import { assertConfigurableProvider } from '@/lib/api/aiSettings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = route(async (request, context) => {
  const { userId } = requireAdmin(request);
  enforceRateLimit(request, LIMITS.write, userId);

  const { provider } = await parseParams(context, providerParam);
  assertConfigurableProvider(provider);

  const body = await parseBody(request, apiKeySchema);

  if (!isEncryptionAvailable()) {
    throw new ApiError(
      503,
      'The server cannot store API keys because SETTINGS_ENCRYPTION_KEY is not set. ' +
        'Generate one with "openssl rand -base64 32" and add it to the environment.',
      'ENCRYPTION_UNAVAILABLE'
    );
  }

  // Verify before storing. Saving a key that does not work leaves an admin
  // looking at a green "configured" badge and a broken assistant.
  const check = await testProvider(provider, { apiKey: body.apiKey, model: body.model || null });
  if (!check.ok) {
    throw new ApiError(400, `That key could not be verified: ${check.error}`, 'API_KEY_REJECTED');
  }

  const apiKeyHint = await saveApiKey(provider, body.apiKey, userId);

  return json({ message: `${provider} API key saved and verified.`, provider, apiKeyHint });
});

export const DELETE = route(async (request, context) => {
  const { userId } = requireAdmin(request);
  enforceRateLimit(request, LIMITS.write, userId);

  const { provider } = await parseParams(context, providerParam);
  assertConfigurableProvider(provider);

  await clearApiKey(provider, userId);
  return json({ message: `${provider} API key removed.`, provider });
});
