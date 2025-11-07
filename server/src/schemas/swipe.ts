import { z } from 'zod';

export const SwipeSchema = z.object({
  targetId: z.string().min(1, 'Target user ID is required'),
  direction: z.enum(['like', 'pass'], {
    errorMap: () => ({ message: 'Direction must be either "like" or "pass"' }),
  }),
});

export type SwipeInput = z.infer<typeof SwipeSchema>;
