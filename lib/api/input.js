import { ApiError } from './respond.js';

/**
 * Request parsing for route handlers.
 *
 * These replace the Express `validate({ body, params, query })` middleware.
 * Parsing rather than merely checking is still the point: a handler receives
 * coerced, defaulted, stripped values and never re-parses a query string or
 * guesses whether a number arrived as a string.
 *
 * A ZodError thrown from here is turned into a field-keyed 400 by `route()`.
 */

/** Parsed JSON body. A malformed or absent body is a 400, not a crash. */
export const parseBody = async (request, schema) => {
  let raw;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, 'Request body is not valid JSON.');
  }
  return schema ? schema.parse(raw ?? {}) : (raw ?? {});
};

/** Parsed search params, flattened to a plain object. */
export const parseQuery = (request, schema) => {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  return schema ? schema.parse(params) : params;
};

/**
 * Parsed dynamic route segments.
 *
 * `context.params` is a promise in Next 15+, so this awaits it — reading it
 * synchronously is the most common way a handler silently receives undefined.
 */
export const parseParams = async (context, schema) => {
  const params = (await context?.params) ?? {};
  return schema ? schema.parse(params) : params;
};
