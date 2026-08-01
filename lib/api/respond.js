import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

/**
 * An error with an HTTP status attached. Throw this from a route handler for
 * any failure the client is meant to see a specific message for.
 */
export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const json = (body, status = 200, headers) =>
  NextResponse.json(body, { status, headers });

/** Field-keyed so a form can attach each message to the input it belongs to. */
const zodFieldErrors = (error) => {
  const fieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
};

/**
 * Translates a thrown error into a response.
 *
 * This is the Express `errorHandler` middleware, reshaped as a function a route
 * handler can call from a catch block. The behaviour is deliberately identical:
 * the full error is logged server-side, and the response carries only what the
 * client needs — an internal message can name a table, a column, or part of a
 * query, none of which should reach a browser.
 */
export const toErrorResponse = (error, request) => {
  const isApiError = error instanceof ApiError;
  const status = error.status || error.statusCode || 500;
  const where = request ? `${request.method} ${new URL(request.url).pathname}` : 'request';

  if (error instanceof ZodError) {
    return json({ message: 'Validation failed', errors: zodFieldErrors(error) }, 400);
  }

  if (status >= 500) {
    console.error(`[${where}]`, error);
  }

  // ─── Translate known database failures into useful client responses ────────
  if (error.name === 'SequelizeUniqueConstraintError') {
    const isFeedbackDuplicate = error.errors?.some((e) =>
      String(e.path || '').includes('projectId')
    );
    return json(
      {
        message: isFeedbackDuplicate
          ? 'You have already reviewed this project. Edit your existing review instead.'
          : 'That value is already taken.',
      },
      409
    );
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return json({ message: 'Referenced record does not exist.' }, 400);
  }

  if (error.name === 'SequelizeValidationError') {
    const fieldErrors = {};
    for (const e of error.errors || []) {
      if (!fieldErrors[e.path]) fieldErrors[e.path] = e.message;
    }
    return json({ message: 'Validation failed', errors: fieldErrors }, 400);
  }

  if (error.name === 'SequelizeDatabaseError') {
    // Message can contain fragments of the failing statement.
    return json({ message: 'Malformed request.' }, 400);
  }

  if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
    return json({ message: 'The database is unavailable. Please try again shortly.' }, 503);
  }

  const body = {
    message:
      isApiError || status < 500
        ? error.message
        : 'Something went wrong on our end. Please try again.',
  };

  if (error.code) body.code = error.code;

  // Stack traces are a development affordance, never a production response.
  if (!env.isProduction && status >= 500) {
    body.detail = error.message;
    body.stack = error.stack;
  }

  return json(body, status);
};

/**
 * Wraps a route handler so a thrown error becomes a formatted response.
 *
 * Replaces the `asyncHandler` + error-middleware pair from Express, which has
 * no equivalent in the App Router — without this, a throw becomes an opaque
 * 500 with a digest and no usable message.
 *
 *   export const GET = route(async (request) => { ... });
 */
export const route = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return toErrorResponse(error, request);
  }
};

export default route;
