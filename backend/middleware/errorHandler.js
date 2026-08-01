import { env } from '../config/env.js';

/**
 * An error with an HTTP status attached. Throw this from a controller for any
 * failure the client is meant to see a specific message for.
 */
export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Wraps an async controller so a rejected promise reaches the error handler.
 * Without it, an async throw becomes an unhandled rejection and the request
 * hangs until it times out.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

/**
 * Central error formatter.
 *
 * The full error is logged server-side. The response carries only what the
 * client needs — an internal message can name a table, a column, or part of a
 * query, none of which should reach a browser.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
export const errorHandler = (error, req, res, next) => {
  const isApiError = error instanceof ApiError;
  const status = error.status || error.statusCode || 500;

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, error);
  }

  // ─── Translate known database failures into useful client responses ────────
  if (error.name === 'SequelizeUniqueConstraintError') {
    const isFeedbackDuplicate = error.errors?.some((e) =>
      String(e.path || '').includes('projectId')
    );
    return res.status(409).json({
      message: isFeedbackDuplicate
        ? 'You have already reviewed this project. Edit your existing review instead.'
        : 'That value is already taken.',
    });
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ message: 'Referenced record does not exist.' });
  }

  if (error.name === 'SequelizeValidationError') {
    const fieldErrors = {};
    for (const e of error.errors || []) {
      if (!fieldErrors[e.path]) fieldErrors[e.path] = e.message;
    }
    return res.status(400).json({ message: 'Validation failed', errors: fieldErrors });
  }

  if (error.name === 'SequelizeDatabaseError') {
    // Message can contain fragments of the failing statement.
    return res.status(400).json({ message: 'Malformed request.' });
  }

  // Body-parser rejects oversized or malformed JSON before any route runs.
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large.' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON.' });
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

  res.status(status).json(body);
};

export default errorHandler;
