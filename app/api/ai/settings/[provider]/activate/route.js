import { requireAdmin } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseParams } from '@/lib/api/input';
import { resolveProviderConfig, setActiveProvider } from '@/lib/services/ai/settingsStore';
import { providerParam } from '@/lib/schemas/aiSettingsSchemas';
import { env } from '@/lib/config/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request, context) => {
  const { userId } = requireAdmin(request);
  enforceRateLimit(request, LIMITS.write, userId);

  const { provider } = await parseParams(context, providerParam);

  if (provider === 'mock' && env.isProduction) {
    throw new ApiError(400, 'The mock provider cannot be active in production.', 'MOCK_NOT_ALLOWED');
  }

  const config = await resolveProviderConfig(provider);
  if (provider !== 'mock' && !config.apiKey) {
    throw new ApiError(
      400,
      'Add an API key for this provider before making it active.',
      'PROVIDER_NOT_CONFIGURED'
    );
  }

  await setActiveProvider(provider, userId);
  return json({ message: `${provider} is now the active provider.`, provider });
});
