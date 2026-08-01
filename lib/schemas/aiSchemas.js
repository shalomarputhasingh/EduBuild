import { z } from 'zod';
import { text } from './common.js';

/**
 * Length caps here are cost control, not just hygiene: every character reaches
 * a metered provider. The history cap also bounds how much context a single
 * request can accumulate.
 */
const MAX_MESSAGE = 2000;
const MAX_HISTORY = 10;
const MAX_MATERIAL_NAME = 160;

export const LANGUAGES = ['english', 'hindi', 'telugu'];

const historyTurn = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string().trim().max(MAX_MESSAGE),
});

export const chatSchema = z
  .object({
    message: z
      .string({ error: 'Message is required' })
      .trim()
      .min(1, 'Message is required')
      .max(MAX_MESSAGE, `Message must be ${MAX_MESSAGE} characters or fewer`),
    history: z
      .array(historyTurn)
      .default([])
      // Keep the most recent turns; older context is the cheapest thing to drop.
      .transform((turns) => turns.slice(-MAX_HISTORY)),
    language: z.enum(LANGUAGES).default('english').catch('english'),
  })
  .strip();

export const projectHelpSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(160),
    description: z.string().trim().max(5000).default(''),
    materials: z
      .array(
        z.union([
          z.string().trim().max(MAX_MATERIAL_NAME),
          z.object({ name: z.string().trim().max(MAX_MATERIAL_NAME) }).transform((m) => m.name),
        ])
      )
      .max(60)
      .default([])
      .transform((list) => list.filter(Boolean)),
    concept: text(160),
    language: z.enum(LANGUAGES).default('english').catch('english'),
  })
  .strip();
