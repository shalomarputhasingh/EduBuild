const isProduction = process.env.NODE_ENV === 'production';

/**
 * Security headers.
 *
 * These were Express middleware (helmet). Next has no middleware chain for
 * this, so the policy is declared here and applied to every response.
 *
 * next/font self-hosts the three faces at build time, so fonts.googleapis.com
 * and fonts.gstatic.com are no longer needed in the policy at all — the font
 * files are served from this origin like any other asset.
 */
const SELF = "'self'";

/** Click-to-load tutorial embeds, and their thumbnails. */
const YOUTUBE = ['https://www.youtube-nocookie.com', 'https://www.youtube.com'];
const YOUTUBE_THUMBS = ['https://i.ytimg.com', 'https://img.youtube.com'];

/** MobileNet weights, fetched only after the user starts the scanner. */
const TFJS_MODELS = ['https://storage.googleapis.com', 'https://tfhub.dev', 'https://www.kaggle.com'];

const csp = [
  `default-src ${SELF}`,

  /**
   * Next's dev overlay and React refresh evaluate injected code, so development
   * needs both relaxations. Production gets neither — except `wasm-unsafe-eval`,
   * which TensorFlow.js requires to instantiate its WASM backend and which does
   * not permit JS eval.
   */
  isProduction
    ? `script-src ${SELF} 'wasm-unsafe-eval'`
    : `script-src ${SELF} 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'`,

  // React sets element styles directly, and Next inlines critical CSS.
  `style-src ${SELF} 'unsafe-inline'`,
  `font-src ${SELF} data:`,

  /**
   * Project images are URLs typed in by teachers, so the host set is not
   * knowable ahead of time. `https:` is deliberately broad here; `blob:` covers
   * frames captured from the camera in the scanner.
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Sequelize and pg are CommonJS with dynamic dialect requires that the
   * bundler cannot statically resolve. Marking them external keeps them as
   * runtime requires in the server build instead of failing at compile time.
   */
  serverExternalPackages: ['sequelize', 'pg', 'pg-hstore'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(self)' },
          ...(isProduction
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains',
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
