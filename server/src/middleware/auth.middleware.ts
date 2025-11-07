import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to extract user from access token
 */
export const extractUser = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.accessToken;

  if (!token) {
    next();
    return;
  }

  const payload = AuthService.verifyAccessToken(token);

  if (payload) {
    req.user = payload;
  }

  next();
};

/**
 * Middleware to guard routes - requires authentication
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
};

/**
 * Middleware to handle authentication errors
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Auth error:', error);

  if (error.message.includes('token')) {
    res.status(401).json({ error: 'Authentication error' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};
