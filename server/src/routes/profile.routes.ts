import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ProfileService } from '../services/profile.service.js';
import { ProfileUpdateSchema, ProfileLocationSchema } from '../schemas/profile.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/profile
 * Get the authenticated user's profile
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await ProfileService.getProfile(req.user!.userId);
    
    res.status(200).json({
      profile: {
        id: profile.id,
        displayName: profile.displayName,
        age: profile.age,
        gender: profile.gender,
        pronouns: profile.pronouns,
        bio: profile.bio,
        status: profile.status,
        locationLat: profile.locationLat,
        locationLng: profile.locationLng,
        radiusPref: profile.radiusPref,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        hobbies: profile.hobbies.map(ph => ({
          id: ph.hobby.id,
          name: ph.hobby.name,
          description: ph.hobby.description,
          category: ph.hobby.category,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/profile
 * Update the authenticated user's profile
 */
router.put('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = ProfileUpdateSchema.parse(req.body);
    
    const updatedProfile = await ProfileService.updateProfile(req.user!.userId, validatedData);
    
    res.status(200).json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedProfile.id,
        displayName: updatedProfile.displayName,
        age: updatedProfile.age,
        gender: updatedProfile.gender,
        pronouns: updatedProfile.pronouns,
        bio: updatedProfile.bio,
        status: updatedProfile.status,
        locationLat: updatedProfile.locationLat,
        locationLng: updatedProfile.locationLng,
        radiusPref: updatedProfile.radiusPref,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt,
        hobbies: updatedProfile.hobbies?.map(ph => ({
          id: ph.hobby.id,
          name: ph.hobby.name,
          description: ph.hobby.description,
          category: ph.hobby.category,
        })) || [],
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    const message = error instanceof Error ? error.message : 'Profile update failed';
    
    if (message.includes('invalid')) {
      res.status(400).json({ error: message });
    } else {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/profile/location
 * Update the authenticated user's location
 */
router.post('/location', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = ProfileLocationSchema.parse(req.body);
    
    const updatedProfile = await ProfileService.updateLocation(req.user!.userId, {
      lat: validatedData.lat,
      lng: validatedData.lng,
    });
    
    res.status(200).json({
      message: 'Location updated successfully',
      location: {
        lat: updatedProfile.locationLat,
        lng: updatedProfile.locationLng,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/hobbies
 * Get all available hobbies/interests
 */
router.get('/hobbies', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string;
    const hobbies = await ProfileService.getHobbiesByCategory(category);
    
    res.status(200).json({
      hobbies: hobbies.map(hobby => ({
        id: hobby.id,
        name: hobby.name,
        description: hobby.description,
        category: hobby.category,
      })),
    });
  } catch (error) {
    console.error('Error fetching hobbies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;