import { z } from 'zod';
import { DIFFICULTIES, text, uuid } from './common.js';

/**
 * Note what is absent: userName and schoolName. Those are read from the
 * authenticated account server-side. Accepting them from the body would let
 * anyone post a review under someone else's name.
 */
export const submitFeedbackSchema = z
  .object({
    projectId: uuid,
    rating: z.coerce
      .number({ error: 'Please give a rating' })
      .int('Rating must be a whole number')
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5'),
    difficulty: z.enum(DIFFICULTIES).optional(),
    feedback: text(2000),
  })
  .strip();

export const projectIdParam = z.object({ projectId: uuid });
