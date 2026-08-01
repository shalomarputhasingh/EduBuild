import { requireAuth } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { json, route } from '@/lib/api/respond';
import { parseBody } from '@/lib/api/input';
import { chat, providerStatus } from '@/lib/services/ai';
import { systemPromptFor } from '@/lib/services/ai/prompts';
import { chatSchema } from '@/lib/schemas/aiSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Authentication is required on every AI route. These calls cost money per
 * request against the server's own key; leaving them open made the endpoint a
 * free proxy to a paid account.
 */
export const POST = route(async (request) => {
  const { userId } = requireAuth(request);
  enforceRateLimit(request, LIMITS.ai, userId);

  const { message, history, language } = await parseBody(request, chatSchema);

  const reply = await chat({
    system: systemPromptFor(language),
    history,
    message,
  });

  const status = await providerStatus();
  return json({ reply, provider: status.provider, model: status.model ?? null });
});
