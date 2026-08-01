import { requireAuth } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseBody } from '@/lib/api/input';
import { resolveVideo } from '@/lib/services/youtube/oembed';
import { youtubePreviewSchema } from '@/lib/schemas/youtubeSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Resolves a pasted YouTube URL into displayable metadata.
 *
 * Used by the submit/edit form to show a preview before saving. The project
 * write path re-resolves independently, so this endpoint is a convenience for
 * the UI rather than the source of what gets stored.
 */
export const POST = route(async (request) => {
  const { userId } = requireAuth(request);
  enforceRateLimit(request, LIMITS.youtube, userId);

  const { url } = await parseBody(request, youtubePreviewSchema);
  const resolved = await resolveVideo(url);

  if (!resolved) {
    throw new ApiError(
      400,
      'That does not look like a YouTube link. Paste a URL like https://www.youtube.com/watch?v=…',
      'INVALID_VIDEO_URL'
    );
  }

  return json({
    ...resolved,
    // `partial` means the id is valid but oEmbed could not be reached. The
    // client should still allow saving — a temporarily unreachable metadata
    // service is no reason to block a teacher from attaching a video.
    message: resolved.partial
      ? 'Video linked. Details could not be loaded right now, but the link will still be saved.'
      : undefined,
  });
});
