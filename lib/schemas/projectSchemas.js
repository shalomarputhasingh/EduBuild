import { z } from 'zod';
import {
  CLASS_LEVELS,
  DIFFICULTIES,
  SUBJECTS,
  requiredText,
  stringList,
  text,
} from './common.js';

/**
 * A single material line.
 *
 * Accepts a bare string too, so a client still posting the legacy
 * comma-separated shape keeps working. See utils/normalizeProject.js.
 */
export const materialSchema = z.union([
  z.string().trim().min(1).max(200).transform((name) => ({ name })),
  z.object({
    name: requiredText(200),
    quantity: text(60),
    estimatedCost: z.coerce.number().min(0).max(1_000_000).nullish(),
    alternative: text(200),
    note: text(300),
  }),
]);

/** A single step. Also accepts a bare string for legacy clients. */
export const stepSchema = z.union([
  z.string().trim().min(1).max(2000).transform((description) => ({ description })),
  z.object({
    title: text(160),
    description: requiredText(2000),
    imageUrl: z.url('Must be a valid URL').max(512).optional().or(z.literal('').transform(() => undefined)),
    safetyNote: text(500),
    // Accepts "1:23" or "83" (seconds).
    videoTimestamp: z
      .string()
      .trim()
      .regex(/^(\d{1,2}:)?\d{1,2}:\d{2}$|^\d{1,5}$/, 'Use mm:ss, hh:mm:ss, or seconds')
      .optional()
      .or(z.literal('').transform(() => undefined)),
  }),
]);

const projectBody = {
  title: requiredText(160, 3),
  summary: text(280),
  description: requiredText(5000, 10),

  subject: z.enum(SUBJECTS, { error: 'Choose a subject' }),
  concept: text(160),
  classLevel: z.enum(CLASS_LEVELS, { error: 'Choose a class level' }),
  difficulty: z.enum(DIFFICULTIES).default('Medium'),
  tags: stringList(12, 40),
  language: z.string().trim().max(8).default('en'),

  budget: z.coerce
    .number({ error: 'Enter an estimated budget' })
    .min(0, 'Budget cannot be negative')
    .max(1_000_000, 'That budget looks too high'),
  estimatedTimeMinutes: z.coerce.number().int().min(1).max(10_000).nullish(),

  materials: z.array(materialSchema).min(1, 'List at least one material').max(60).default([]),
  steps: z.array(stepSchema).min(1, 'Add at least one step').max(60).default([]),
  learningOutcomes: stringList(15, 200),
  safetyPrecautions: stringList(15, 300),

  image: z.url('Must be a valid URL').max(512).optional().or(z.literal('').transform(() => undefined)),
  videoUrl: z.string().trim().max(512).optional().or(z.literal('').transform(() => undefined)),
};

export const createProjectSchema = z.object(projectBody).strip();

/**
 * Update reuses the same field rules but makes everything optional, so a form
 * can PATCH a subset without restating the whole guide.
 *
 * `.strip()` is what stops mass assignment: createdBy, rating, status, id and
 * the timestamps are not in this shape, so they are removed before the
 * controller ever sees them.
 */
export const updateProjectSchema = z.object(projectBody).partial().strip();

export const updateStatusSchema = z
  .object({
    // Only these two. 'pending' is not a destination an admin can select —
    // it is where a submission starts and where an edit returns it.
    status: z.enum(['approved', 'rejected'], { error: 'Status must be approved or rejected' }),
    rejectionReason: text(1000),
  })
  .refine((data) => data.status !== 'rejected' || Boolean(data.rejectionReason), {
    message: 'A reason is required when rejecting a project',
    path: ['rejectionReason'],
  });
