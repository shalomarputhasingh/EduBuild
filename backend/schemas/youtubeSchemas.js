import { z } from 'zod';

export const youtubePreviewSchema = z
  .object({
    url: z
      .string({ error: 'Paste a YouTube link' })
      .trim()
      .min(1, 'Paste a YouTube link')
      .max(512, 'That link is too long'),
  })
  .strip();
