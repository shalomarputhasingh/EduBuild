import { requireAdmin } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { json, route } from '@/lib/api/respond';
import { parseBody, parseParams } from '@/lib/api/input';
import { resolveProviderConfig } from '@/lib/services/ai/settingsStore';
import { testProvider } from '@/lib/services/ai';
import { providerParam, testConnectionSchema } from '@/lib/schemas/aiSettingsSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request, context) => {
  const { userId } = requireAdmin(request);
  enforceRateLimit(request, LIMITS.ai, userId);

  const { provider } = await parseParams(context, providerParam);
  const body = await parseBody(request, testConnectionSchema);
  const config = await resolveProviderConfig(provider);

  const result = await testProvider(provider, {
    apiKey: config.apiKey,
    model: body?.model || config.model,
  });

  return json(
    {
      provider,
      ok: result.ok,
      message: result.ok ? 'The provider responded successfully.' : result.error,
      sample: result.sample ?? null,
    },
    result.ok ? 200 : 400
  );
});
