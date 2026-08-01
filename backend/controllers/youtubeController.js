import { resolveVideo } from '../services/youtube/oembed.js';
import { ApiError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

/**
 * Resolves a pasted YouTube URL into displayable metadata.
 *
 * Used by the submit/edit form to show a preview before saving. The project
 * write path re-resolves independently, so this endpoint is a convenience for
 * the UI rather than the source of what gets stored.
 */
export const previewVideo = async (req, res) => {
  const resolved = await resolveVideo(req.body.url);

  if (!resolved) {
    throw new ApiError(
      400,
      'That does not look like a YouTube link. Paste a URL like https://www.youtube.com/watch?v=…',
      'INVALID_VIDEO_URL'
    );
  }

  res.json({
    ...resolved,
    // `partial` means the id is valid but oEmbed could not be reached. The
    // client should still allow saving — a temporarily unreachable metadata
    // service is no reason to block a teacher from attaching a video.
    message: resolved.partial
      ? 'Video linked. Details could not be loaded right now, but the link will still be saved.'
      : undefined,
  });
};

/**
 * Tutorial search. Designed, deliberately not enabled.
 *
 * The Data API costs 100 quota units per search against a 10,000/day default —
 * roughly 100 searches a day for the whole platform. Turning it on needs
 * caching and a per-user cap first, and results must always be presented for a
 * teacher to choose from rather than attached automatically.
 */
export const searchVideos = async (req, res) => {
  if (!env.YOUTUBE_API_KEY) {
    return res.status(501).json({
      message: 'Video search is not enabled on this server. Paste a YouTube link instead.',
      code: 'YOUTUBE_SEARCH_DISABLED',
    });
  }

  return res.status(501).json({
    message: 'Video search is planned but not yet implemented. Paste a YouTube link instead.',
    code: 'YOUTUBE_SEARCH_NOT_IMPLEMENTED',
  });
};
