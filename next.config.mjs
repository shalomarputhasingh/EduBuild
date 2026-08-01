const isProduction = process.env.NODE_ENV === 'production';

/**
 * The Content-Security-Policy is NOT set here.
 *
 * It needs a per-request nonce so Next's inline bootstrap scripts can run
 * without opening the policy up to `'unsafe-inline'`, and a static header
 * cannot carry one. It is issued by `middleware.js`; the policy itself lives in
 * `lib/csp.js` so there is exactly one definition of it.
 *
 * The headers below are request-independent and stay here.
 */

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
