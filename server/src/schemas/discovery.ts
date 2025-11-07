import { z } from 'zod';

export const DiscoveryQuerySchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
  radius: z.number().int().min(1).max(500).optional(), // Override user's radius preference
  genderPreference: z.enum(['male', 'female', 'non-binary', 'other']).optional(),
  minAge: z.number().int().min(18).max(120).optional(),
  maxAge: z.number().int().min(18).max(120).optional(),
  sameCity: z.boolean().default(false),
});

export type DiscoveryQueryInput = z.infer<typeof DiscoveryQuerySchema>;