import { requireAuth } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { json, route } from '@/lib/api/respond';
import { env } from '@/lib/config/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Tutorial search. Designed, deliberately not enabled.
 *
 * The Data API costs 100 quota units per search against a 10,000/day default —
 * roughly 100 searches a day for the whole platform. Turning it on needs
 * caching and a per-user cap first, and results must always be presented for a
 * teacher to choose from rather than attached automatically.
 */
export const GET = route(async (request) => {
  const { userId } = requireAuth(request);
  enforceRateLimit(request, LIMITS.youtube, userId);

  if (!env.YOUTUBE_API_KEY) {
    return json(
      {
        message: 'Video search is not enabled on this server. Paste a YouTube link instead.',
        code: 'YOUTUBE_SEARCH_DISABLED',
      },
      501
    );
  }

  return json(
    {
      message: 'Video search is planned but not yet implemented. Paste a YouTube link instead.',
      code: 'YOUTUBE_SEARCH_NOT_IMPLEMENTED',
    },
    501
  );
});
