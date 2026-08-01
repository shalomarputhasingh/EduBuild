import { z } from 'zod';

export const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Engineering'];
export const CLASS_LEVELS = ['6-8', '9-10', '11-12'];
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
export const STATUSES = ['pending', 'approved', 'rejected'];

export const uuid = z.string().uuid('Must be a valid id');

export const idParam = z.object({ id: uuid });

/** Trimmed string with a length ceiling. Empty becomes undefined, not ''. */
export const text = (max, { min = 0 } = {}) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .min(min, min > 0 ? `Must be at least ${min} characters` : undefined)
    .transform((v) => (v === '' ? undefined : v))
    .optional();

/** Required trimmed string. */
export const requiredText = (max, min = 1) =>
  z
    .string({ error: 'This field is required' })
    .trim()
    .min(min, min === 1 ? 'This field is required' : `Must be at least ${min} characters`)
    .max(max, `Must be ${max} characters or fewer`);

/**
 * Array of short strings, de-duplicated and with blanks dropped.
 * Used for tags, learning outcomes and safety precautions.
 */
export const stringList = (maxItems, maxLength) =>
  z
    .array(z.string().trim().max(maxLength))
    .max(maxItems, `At most ${maxItems} entries`)
    .transform((list) => [...new Set(list.filter(Boolean))])
    .default([]);
