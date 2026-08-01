import { requireAdmin } from '@/lib/api/auth';
import { json, route } from '@/lib/api/respond';
import { listProviderStatus } from '@/lib/services/ai/settingsStore';
import { isEncryptionAvailable } from '@/lib/utils/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin-only AI configuration.
 *
 * The invariant across every handler under this path: a decrypted API key is
 * never placed in a response body. Clients receive a masked hint and a boolean,
 * which is enough to render the UI and not enough to authenticate with.
 */
export const GET = route(async (request) => {
  requireAdmin(request);

  return json({
    providers: await listProviderStatus(),
    // The UI disables key entry and explains why when this is false, rather
    // than accepting a key and silently failing to store it.
    canStoreKeys: isEncryptionAvailable(),
  });
});
