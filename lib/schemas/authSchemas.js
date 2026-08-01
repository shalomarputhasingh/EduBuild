import { z } from 'zod';
import { requiredText, text } from './common.js';

export const signupSchema = z
  .object({
    name: requiredText(120, 2),
    email: z.email('Enter a valid email address').max(255).toLowerCase().trim(),
    password: z
      .string({ error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be 128 characters or fewer'),
    school: text(160),
    state: text(80),
  })
  // A `role` in the body is dropped rather than rejected: rejecting it would
  // turn an old client into a hard error, while stripping it silently gives the
  // same security outcome. Role is assigned server-side in every case.
  .strip();

export const signinSchema = z.object({
  email: z.email('Enter a valid email address').max(255).toLowerCase().trim(),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(128),
});
