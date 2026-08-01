import { connectDB } from '@/lib/config/db';
import { json, route } from '@/lib/api/respond';
import { providerStatus } from '@/lib/services/ai';
import { env } from '@/lib/config/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  // Each dependency is probed independently: a database problem must not take
  // the health endpoint down with it — reporting that is what it exists for.
  let database = 'ok';
  try {
    await connectDB();
  } catch {
    database = 'unavailable';
  }

  let ai = { provider: 'unknown', configured: false };
  try {
    ai = await providerStatus();
  } catch {
    ai = { provider: 'unknown', configured: false, error: 'unavailable' };
  }

  return json({
    status: database === 'ok' ? 'ok' : 'degraded',
    environment: env.NODE_ENV,
    database,
    ai,
  });
});
