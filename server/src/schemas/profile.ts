import { z } from 'zod';

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  age: z.number().int().min(18).max(120).optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'other']).optional(),
  pronouns: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  status: z.enum(['active', 'inactive', 'hidden']).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  radiusPref: z.number().int().min(1).max(500).optional(),
  hobbies: z.array(z.string()).optional(),
});

export const ProfileLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  manualEntry: z.boolean().default(false),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type ProfileLocationInput = z.infer<typeof ProfileLocationSchema>;