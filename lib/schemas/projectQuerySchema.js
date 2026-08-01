import { z } from 'zod';
import { CLASS_LEVELS, DIFFICULTIES, STATUSES, SUBJECTS } from './common.js';

/**
 * Sort options, mapped to Sequelize order clauses.
 *
 * The mapping exists so a client can never influence the ORDER BY beyond
 * choosing one of these keys — the column names are never taken from input.
 */
export const SORT_OPTIONS = {
  newest: [['createdAt', 'DESC']],
  oldest: [['createdAt', 'ASC']],
  budget_asc: [['budget', 'ASC']],
  budget_desc: [['budget', 'DESC']],
  rating_desc: [
    ['rating', 'DESC'],
    ['createdAt', 'DESC'],
  ],
  title_asc: [['title', 'ASC']],
};

const optionalTrimmed = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const projectQuerySchema = z
  .object({
    search: optionalTrimmed(120),
    material: optionalTrimmed(80),
    tag: optionalTrimmed(40),

    subject: z.enum(SUBJECTS).optional().catch(undefined),
    classLevel: z.enum(CLASS_LEVELS).optional().catch(undefined),
    difficulty: z.enum(DIFFICULTIES).optional().catch(undefined),
    status: z.enum(STATUSES).optional().catch(undefined),

    budgetMin: z.coerce.number().min(0).max(1_000_000).optional().catch(undefined),
    budgetMax: z.coerce.number().min(0).max(1_000_000).optional().catch(undefined),

    page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
    // Capped so a client cannot ask for the entire table in one request.
    limit: z.coerce.number().int().min(1).max(50).default(12).catch(12),

    sort: z.enum(Object.keys(SORT_OPTIONS)).default('newest').catch('newest'),
  })
  // A reversed range is a typo, not an attack — swap it rather than erroring,
  // so a slider dragged past itself still returns sensible results.
  .transform((q) => {
    if (q.budgetMin != null && q.budgetMax != null && q.budgetMin > q.budgetMax) {
      return { ...q, budgetMin: q.budgetMax, budgetMax: q.budgetMin };
    }
    return q;
  });
