import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma.js';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Example endpoint to test database connection
app.get('/api/hobbies', async (req: Request, res: Response): Promise<void> => {
  try {
    const hobbies = await prisma.hobby.findMany({
      orderBy: { category: 'asc' },
    });
    res.json({ hobbies });
  } catch (error) {
    console.error('Error fetching hobbies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, (): void => {
  console.log(`Server is running on port ${port}`);
});
