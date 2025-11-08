import { z } from 'zod';

export const MatchMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(1000, 'Message content must be 1000 characters or less'),
});
