import { z } from 'zod';
import { PROVIDERS } from '../services/ai/settingsStore.js';

export const providerParam = z.object({
  provider: z.enum(PROVIDERS, { error: 'Unknown AI provider' }),
});

export const apiKeySchema = z
  .object({
    apiKey: z
      .string({ error: 'Paste an API key' })
      .trim()
      .min(8, 'That does not look like a valid API key')
      .max(512, 'That key is longer than any provider issues')
      // Provider keys are printable ASCII. Rejecting anything else catches a
      // pasted newline or smart quote before it reaches an Authorization header,
      // where it would cause an opaque failure.
      .regex(/^[\x21-\x7E]+$/, 'The key contains characters no provider uses — check for stray spaces'),
    model: z.string().trim().max(160).optional(),
  })
  .strip();

export const modelSchema = z
  .object({
    // Empty string means "revert to the provider default".
    model: z.string().trim().max(160).nullish(),
  })
  .strip();

export const testConnectionSchema = z
  .object({
    model: z.string().trim().max(160).optional(),
  })
  .strip();
