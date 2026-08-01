/**
 * Content-Security-Policy, built per request so it can carry a nonce.
 *
 * Next injects several inline bootstrap scripts (`self.__next_f.push(...)`)
 * that carry the streamed RSC payload. Under a policy of `script-src 'self'`
 * the browser blocks all of them, React never hydrates, and any page with a
 * Suspense boundary shows its fallback spinner forever. Allowing
 * `'unsafe-inline'` would fix that by making the script policy meaningless;
 * a nonce fixes it while keeping the policy real.
 *
 * `'strict-dynamic'` lets the nonced bootstrap load the rest of the chunks
 * without each one needing its own nonce.
 */

const SELF = "'self'";

/** Click-to-load tutorial embeds, and their thumbnails. */
const YOUTUBE = ['https://www.youtube-nocookie.com', 'https://www.youtube.com'];
const YOUTUBE_THUMBS = ['https://i.ytimg.com', 'https://img.youtube.com'];

/** MobileNet weights, fetched only after the user starts the scanner. */
const TFJS_MODELS = ['https://storage.googleapis.com', 'https://tfhub.dev', 'https://www.kaggle.com'];

export const buildCsp = ({ nonce, isProduction }) => {
  /**
   * Development runs the Next dev overlay and React refresh, which evaluate
   * injected code, so it needs both relaxations. Production gets neither —
   * except `wasm-unsafe-eval`, which TensorFlow.js requires to instantiate its
   * WASM backend and which does not permit JS eval.
   */
  const scriptSrc = isProduction
    ? `script-src ${SELF} 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`
    : `script-src ${SELF} 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'`;

  return [
    `default-src ${SELF}`,
    scriptSrc,

    // React sets element styles directly, and Next inlines critical CSS.
    `style-src ${SELF} 'unsafe-inline'`,
    `font-src ${SELF} data:`,

    /**
     * Project images are URLs typed in by teachers, so the host set is not
     * knowable ahead of time. `https:` is deliberately broad here; `blob:`
     * covers frames captured from the camera in the scanner.
     */
    `img-src ${SELF} data: blob: https:`,
    `media-src ${SELF} blob:`,

    isProduction
      ? `connect-src ${SELF} ${[...TFJS_MODELS, ...YOUTUBE_THUMBS].join(' ')}`
      : `connect-src ${SELF} ws: wss: ${[...TFJS_MODELS, ...YOUTUBE_THUMBS].join(' ')}`,

    `frame-src ${YOUTUBE.join(' ')}`,
    `worker-src ${SELF} blob:`,

    "object-src 'none'",
    `base-uri ${SELF}`,
    `form-action ${SELF}`,
    "frame-ancestors 'none'",
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
};

export default buildCsp;
