import {
  buildEmbedUrl,
  buildThumbnailUrl,
  buildWatchUrl,
  extractVideoId,
  isValidVideoId,
} from './parseUrl.js';

/**
 * Video metadata via YouTube's public oEmbed endpoint.
 *
 * oEmbed needs no API key and has no published quota, which is why it is the
 * default rather than the Data API. It returns title, author and a thumbnail —
 * everything the preview card and the detail page need.
 *
 * It is an undocumented-for-quota public endpoint, so every failure path here
 * degrades rather than throws: a video that cannot be looked up is still a
 * video the teacher can save.
 */

const OEMBED_ENDPOINT = 'https://www.youtube.com/oembed';
const TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

/** videoId -> { value, expiresAt } */
const cache = new Map();

const readCache = (videoId) => {
  const hit = cache.get(videoId);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    cache.delete(videoId);
    return undefined;
  }
  // Refresh insertion order so the eviction below is roughly least-recently-used.
  cache.delete(videoId);
  cache.set(videoId, hit);
  return hit.value;
};

const writeCache = (videoId, value) => {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(videoId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

export const clearOembedCache = () => cache.clear();

/**
 * Fetches oEmbed metadata for a video id.
 * @returns {Promise<{title, channel, thumbnail}|null>} null on any failure.
 */
export const fetchOembed = async (videoId) => {
  if (!isValidVideoId(videoId)) return null;

  const cached = readCache(videoId);
  if (cached !== undefined) return cached;

  const watchUrl = buildWatchUrl(videoId);
  const requestUrl = `${OEMBED_ENDPOINT}?url=${encodeURIComponent(watchUrl)}&format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(requestUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    // 401/404 means private, deleted, or embedding disabled. Cache the negative
    // result so a broken link is not retried on every page load.
    if (!response.ok) {
      writeCache(videoId, null);
      return null;
    }

    const data = await response.json();

    const result = {
      title: typeof data.title === 'string' ? data.title.slice(0, 255) : null,
      channel: typeof data.author_name === 'string' ? data.author_name.slice(0, 255) : null,
      thumbnail:
        typeof data.thumbnail_url === 'string'
          ? data.thumbnail_url.slice(0, 512)
          : buildThumbnailUrl(videoId),
    };

    writeCache(videoId, result);
    return result;
  } catch {
    // Timeout, DNS failure, malformed JSON — all the same to the caller.
    // Not cached: a transient network problem should not poison the entry.
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Resolves a pasted URL into the metadata stored on a project.
 *
 * @returns {Promise<null | {
 *   videoUrl, videoId, videoTitle, videoThumbnail, videoChannel,
 *   videoSource, embedUrl, watchUrl, partial
 * }>} null when the input is not a YouTube URL at all.
 *
 * `partial: true` means the id is valid but oEmbed could not be reached — the
 * caller should still save the URL and show a reduced preview.
 */
export const resolveVideo = async (url) => {
  const videoId = extractVideoId(url);
  if (!videoId) return null;

  const meta = await fetchOembed(videoId);

  return {
    videoUrl: buildWatchUrl(videoId),
    videoId,
    videoTitle: meta?.title ?? null,
    videoChannel: meta?.channel ?? null,
    videoThumbnail: meta?.thumbnail ?? buildThumbnailUrl(videoId),
    videoSource: 'manual',
    embedUrl: buildEmbedUrl(videoId),
    watchUrl: buildWatchUrl(videoId),
    partial: meta === null,
  };
};

/** The columns to write when a project has no video. */
export const emptyVideoFields = () => ({
  videoUrl: '',
  videoId: null,
  videoTitle: null,
  videoThumbnail: null,
  videoChannel: null,
  videoSource: 'none',
});

export default { fetchOembed, resolveVideo, emptyVideoFields, clearOembedCache };
