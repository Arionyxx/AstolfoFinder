import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { DiscoveryService } from '../services/discovery.service.js';
import { DiscoveryQuerySchema } from '../schemas/discovery.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/discovery/profiles
 * Get nearby profiles for discovery feed
 * 
 * Query parameters:
 * - limit: number of profiles to return (1-50, default: 20)
 * - offset: number of profiles to skip (default: 0)
 * - radius: search radius in miles (1-500, optional, overrides user preference)
 * - genderPreference: filter by gender (male/female/non-binary/other, optional)
 * - minAge: minimum age filter (18-120, optional)
 * - maxAge: maximum age filter (18-120, optional)
 * - sameCity: filter to same city only (boolean, default: false)
 */
router.get('/profiles', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedQuery = DiscoveryQuerySchema.parse(req.query);
    
    const result = await DiscoveryService.getNearbyProfiles(
      req.user!.userId,
      validatedQuery
    );
    
    res.status(200).json({
      profiles: result.profiles,
      pagination: {
        hasMore: result.hasMore,
        total: result.total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: error.errors 
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Discovery fetch failed';
    
    if (message.includes('location is required')) {
      res.status(400).json({ 
        error: 'Location is required for discovery. Please set your location in your profile.' 
      });
    } else {
      console.error('Error fetching discovery profiles:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/discovery/preferences
 * Get user's discovery preferences
 */
router.get('/preferences', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const preferences = await DiscoveryService.getDiscoveryPreferences(req.user!.userId);
    
    res.status(200).json({
      preferences,
    });
  } catch (error) {
    console.error('Error fetching discovery preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;