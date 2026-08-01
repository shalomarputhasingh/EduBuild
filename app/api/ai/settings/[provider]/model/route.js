import { requireAdmin } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { json, route } from '@/lib/api/respond';
import { parseBody, parseParams } from '@/lib/api/input';
import { saveModel } from '@/lib/services/ai/settingsStore';
import { providerParam, modelSchema } from '@/lib/schemas/aiSettingsSchemas';
import { assertConfigurableProvider } from '@/lib/api/aiSettings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = route(async (request, context) => {
  const { userId } = requireAdmin(request);
  enforceRateLimit(request, LIMITS.write, userId);

  const { provider } = await parseParams(context, providerParam);
  assertConfigurableProvider(provider);

  const { model } = await parseBody(request, modelSchema);
  await saveModel(provider, model, userId);

  return json({
    message: model ? `Model set to ${model}.` : 'Reverted to the provider default.',
    provider,
    model: model || null,
  });
});
