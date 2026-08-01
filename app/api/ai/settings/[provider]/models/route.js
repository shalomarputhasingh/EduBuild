import { requireAdmin } from '@/lib/api/auth';
import { json, route } from '@/lib/api/respond';
import { parseParams, parseQuery } from '@/lib/api/input';
import { resolveProviderConfig } from '@/lib/services/ai/settingsStore';
import { fetchModels } from '@/lib/services/ai/modelCatalog';
import { providerParam } from '@/lib/schemas/aiSettingsSchemas';
import { assertConfigurableProvider } from '@/lib/api/aiSettings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Live model catalogue for a provider.
 *
 * Models are read from the provider's own API using the configured key, never
 * from a list baked into this codebase — providers retire and rename models
 * often enough that a hardcoded list goes stale without anyone noticing.
 */
export const GET = route(async (request, context) => {
  requireAdmin(request);

  const { provider } = await parseParams(context, providerParam);
  assertConfigurableProvider(provider);

  const config = await resolveProviderConfig(provider);
  const { refresh } = parseQuery(request);

  const { models, error } = await fetchModels(provider, config.apiKey, {
    force: refresh === 'true',
  });

  return json({ provider, models, selected: config.model, error });
});
