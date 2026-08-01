import { ZodError } from 'zod';

/**
 * Parses a request through zod schemas and replaces the raw input with the
 * parsed result.
 *
 * Parsing rather than merely checking is the point: controllers receive
 * coerced, defaulted, stripped values, so they never re-parse a query string
 * or guess whether a number arrived as a string.
 *
 *   router.post('/', validate({ body: createProjectSchema }), createProject)
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.params) req.params = schemas.params.parse(req.params ?? {});
    if (schemas.query) {
      // req.query is a getter-only property on Express 5 and a plain object on
      // Express 4. Stash the parsed result separately so this works on both.
      req.validatedQuery = schemas.query.parse(req.query ?? {});
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Field-keyed so a form can attach each message to the input it belongs to.
      const fieldErrors = {};
      for (const issue of error.issues) {
        const key = issue.path.join('.') || '_';
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }

      return res.status(400).json({
        message: 'Validation failed',
        errors: fieldErrors,
      });
    }
    next(error);
  }
};

export default validate;
