import { requireAuth } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { json, route } from '@/lib/api/respond';
import { parseBody } from '@/lib/api/input';
import { generate, providerStatus } from '@/lib/services/ai';
import { systemPromptFor, projectHelpPrompt } from '@/lib/services/ai/prompts';
import { projectHelpSchema } from '@/lib/schemas/aiSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request) => {
  const { userId } = requireAuth(request);
  enforceRateLimit(request, LIMITS.ai, userId);

  const { title, description, materials, concept, language } = await parseBody(
    request,
    projectHelpSchema
  );

  const explanation = await generate({
    system: systemPromptFor(language),
    prompt: projectHelpPrompt({ title, description, materials, concept, language }),
  });

  const status = await providerStatus();
  return json({ explanation, provider: status.provider, model: status.model ?? null });
});
