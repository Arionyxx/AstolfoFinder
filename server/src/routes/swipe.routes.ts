import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { SwipeService } from '../services/swipe.service.js';
import { SwipeSchema } from '../schemas/swipe.js';
import { MatchMessageSchema } from '../schemas/match.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /api/swipes
 * Record a swipe action (like or pass)
 *
 * Request body:
 * - targetId: string (ID of the user being swiped on)
 * - direction: "like" | "pass"
 *
 * Responses:
 * - 201: Swipe recorded successfully
 * - 400: Invalid input or daily limit reached
 * - 401: Unauthorized
 * - 409: Already swiped on this user or user not found
 * - 500: Internal server error
 */
router.post('/swipes', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = SwipeSchema.parse(req.body);

    const result = await SwipeService.recordSwipe(
      req.user!.userId,
      validatedData.targetId,
      validatedData.direction
    );

    res.status(201).json({
      swipe: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Invalid input',
        details: error.errors,
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('Daily swipe limit')) {
      res.status(429).json({
        error: message,
        retryAfter: 'midnight UTC',
      });
    } else if (message.includes('already swiped')) {
      res.status(409).json({
        error: message,
      });
    } else if (message.includes('not found') || message.includes('yourself')) {
      res.status(400).json({
        error: message,
      });
    } else {
      console.error('Error recording swipe:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/swipes/status
 * Get swipe statistics for current user
 *
 * Responses:
 * - 200: Swipe statistics
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.get('/swipes/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await SwipeService.getSwipeStats(req.user!.userId);

    res.status(200).json({
      stats,
    });
  } catch (error) {
    console.error('Error fetching swipe status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/matches
 * Get all matches for current user
 *
 * Responses:
 * - 200: List of matches
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.get('/matches', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const matches = await SwipeService.getUserMatches(req.user!.userId);

    res.status(200).json({
      matches,
      total: matches.length,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/matches/:matchId
 * Get details for a specific match
 *
 * Path parameters:
 * - matchId: string
 *
 * Responses:
 * - 200: Match details
 * - 401: Unauthorized
 * - 403: Forbidden (not part of this match)
 * - 404: Match not found
 * - 500: Internal server error
 */
router.get('/matches/:matchId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;

    const matchDetails = await SwipeService.getMatchDetails(matchId, req.user!.userId);

    res.status(200).json({
      match: matchDetails,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('Unauthorized')) {
      res.status(403).json({ error: message });
    } else {
      console.error('Error fetching match details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/matches/:matchId/messages
 * Retrieve placeholder conversation messages for a match
 */
router.get('/matches/:matchId/messages', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;
    const messages = await SwipeService.getMatchMessages(matchId, req.user!.userId);

    res.status(200).json({
      messages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('Unauthorized')) {
      res.status(403).json({ error: message });
    } else {
      console.error('Error fetching match messages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/matches/:matchId/messages
 * Store a placeholder message for a match conversation
 */
router.post('/matches/:matchId/messages', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;
    const { content } = MatchMessageSchema.parse(req.body);

    const message = await SwipeService.addMatchMessage(matchId, req.user!.userId, content);

    res.status(201).json({
      message,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Invalid input',
        details: error.errors,
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('Unauthorized')) {
      res.status(403).json({ error: message });
    } else if (message.includes('Message content')) {
      res.status(400).json({ error: message });
    } else {
      console.error('Error posting match message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
