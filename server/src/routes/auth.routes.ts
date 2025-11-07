import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../schemas/auth.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = RegisterSchema.parse(req.body);

    const result = await AuthService.register(validatedData.email, validatedData.password);

    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    const message = error instanceof Error ? error.message : 'Registration failed';

    if (message.includes('already exists')) {
      res.status(409).json({ error: 'User with this email already exists' });
    } else {
      res.status(400).json({ error: message });
    }
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = LoginSchema.parse(req.body);

    const result = await AuthService.login(validatedData.email, validatedData.password);

    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      user: result.user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    res.status(401).json({ error: 'Invalid email or password' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token not found' });
      return;
    }

    const result = await AuthService.refreshTokens(refreshToken);

    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Tokens refreshed successfully',
      user: result.user,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', requireAuth, (req: Request, res: Response): void => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({ message: 'Logout successful' });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, (req: Request, res: Response): void => {
  res.status(200).json({
    user: req.user,
  });
});

export default router;
