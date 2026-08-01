import { NextResponse } from 'next/server';
import { buildCsp } from '@/lib/csp';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Issues a fresh CSP nonce per request.
 *
 * Next reads the nonce out of the `Content-Security-Policy` on the *request*
 * headers and stamps it onto every script tag it renders, which is the only way
 * its inline bootstrap scripts can run under a policy that forbids
 * `'unsafe-inline'`. The same policy goes onto the response for the browser to
 * enforce.
 *
 * A nonce means the HTML cannot be cached, so pages render per request rather
 * than being served from the static prerender. That is an accepted cost here:
 * every page is a client component that fetches its own data anyway, so the
 * prerendered HTML was only ever an empty shell.
 */
export function middleware(request) {
  // Web Crypto rather than node:crypto — middleware runs on the Edge runtime.
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp({ nonce, isProduction });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    /**
     * Document requests only. Static assets and images are already covered by
     * the page's own policy and do not need a nonce; running middleware on them
     * would add a per-asset cost for nothing.
     *
     * `_next/static` and `_next/image` are excluded, as is the favicon.
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
