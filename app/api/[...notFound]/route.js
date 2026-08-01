import { json } from '@/lib/api/respond';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Catch-all for unmatched /api paths.
 *
 * Without it Next answers an unknown endpoint with the HTML not-found page, so
 * a mistyped route reaches the client as markup that axios then fails to parse
 * — the error surfaces as a JSON syntax error rather than "no such endpoint".
 * The Express server scoped its 404 handler to /api for the same reason.
 *
 * Least-specific route in the tree, so it only runs when nothing else matched.
 */
const notFound = (request) =>
  json({ message: `Route not found: ${request.method} ${new URL(request.url).pathname}` }, 404);

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const HEAD = notFound;
export const OPTIONS = notFound;
