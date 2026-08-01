/**
 * YouTube URL parsing.
 *
 * The previous implementation matched on substrings (`url.includes('v=')`),
 * which would happily accept `https://evil.example/?v=xxxxxxxxxxx` and store it
 * as a YouTube video. This parses properly and checks the host against an
 * allowlist, so only real YouTube links produce an id.
 */

const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'www.youtu.be',
]);

/** YouTube ids are exactly 11 characters from this alphabet. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Path prefixes that carry the id as the next segment. */
const PATH_PREFIXES = ['embed', 'shorts', 'live', 'v'];

export const isValidVideoId = (id) => typeof id === 'string' && VIDEO_ID.test(id);

/**
 * Extracts a video id from a YouTube URL, or null.
 *
 * Accepts:
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 *   https://www.youtube.com/live/ID
 *   a bare 11-character ID
 */
export const extractVideoId = (input) => {
  if (typeof input !== 'string') return null;

  const raw = input.trim();
  if (raw === '') return null;

  // A bare id, pasted without the surrounding URL.
  if (VIDEO_ID.test(raw)) return raw;

  // Tolerate a missing scheme so "youtube.com/watch?v=..." still parses.
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;

  // youtu.be/ID — the id is the whole path.
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return isValidVideoId(id) ? id : null;
  }

  // youtube.com/watch?v=ID
  const queryId = url.searchParams.get('v');
  if (isValidVideoId(queryId)) return queryId;

  // youtube.com/{embed,shorts,live,v}/ID
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length >= 2 && PATH_PREFIXES.includes(segments[0].toLowerCase())) {
    const id = segments[1];
    if (isValidVideoId(id)) return id;
  }

  return null;
};

export const isYouTubeUrl = (input) => extractVideoId(input) !== null;

/** Canonical watch URL, rebuilt from the id rather than echoing user input. */
export const buildWatchUrl = (videoId) =>
  isValidVideoId(videoId) ? `https://www.youtube.com/watch?v=${videoId}` : null;

/** Privacy-preserving embed URL — no cookie until the visitor plays the video. */
export const buildEmbedUrl = (videoId) =>
  isValidVideoId(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;

/** Thumbnail derived from the id. Needs no API call and no key. */
export const buildThumbnailUrl = (videoId, quality = 'hqdefault') =>
  isValidVideoId(videoId) ? `https://i.ytimg.com/vi/${videoId}/${quality}.jpg` : null;

export default { extractVideoId, isYouTubeUrl, isValidVideoId, buildWatchUrl, buildEmbedUrl, buildThumbnailUrl };
