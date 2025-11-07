import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import prisma from './lib/prisma.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import discoveryRoutes from './routes/discovery.routes.js';
import swipeRoutes from './routes/swipe.routes.js';
import { extractUser, errorHandler } from './middleware/auth.middleware.js';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Extract user from cookies
app.use(extractUser);

app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Profile routes
app.use('/api', profileRoutes);

// Discovery routes
app.use('/api/discovery', discoveryRoutes);

// Swipe and match routes
app.use('/api', swipeRoutes);

// Error handler
app.use(errorHandler);

app.listen(port, (): void => {
  console.log(`Server is running on port ${port}`);
});

export default app;
