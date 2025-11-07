import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import profileRoutes from './profile.routes.js';
import { extractUser } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';

describe('Profile Routes', () => {
  const testEmail = `test-profile-${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123';
  let app: Express;
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    // Setup test app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(extractUser);
    app.use('/api', profileRoutes);

    // Create test user
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        emailVerified: true,
      },
    });

    // Create default profile
    await prisma.profile.create({
      data: {
        userId: user.id,
        status: 'active',
        radiusPref: 25,
      },
    });

    userId = user.id;

    // Generate test token
    const payload = {
      userId: user.id,
      email: user.email,
    };

    accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '15m',
    });

    // Seed hobbies for testing
    await prisma.hobby.createMany({
      data: [
        { name: 'Test Hobby 1', category: 'Test', description: 'Test hobby 1' },
        { name: 'Test Hobby 2', category: 'Test', description: 'Test hobby 2' },
        { name: 'Test Hobby 3', category: 'Test', description: 'Test hobby 3' },
        { name: 'Sports Hobby', category: 'Sports', description: 'A sports related hobby' },
      ],
      skipDuplicates: true,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.profileHobby.deleteMany({
      where: {
        profile: {
          user: {
            email: {
              contains: 'test-profile',
            },
          },
        },
      },
    });
    
    await prisma.profile.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test-profile',
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-profile',
        },
      },
    });

    await prisma.hobby.deleteMany({
      where: {
        name: {
          contains: 'Test',
        },
      },
    });
  });

  describe('GET /api/profile', () => {
    it('should return user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('id');
      expect(response.body.profile).toHaveProperty('status', 'active');
      expect(response.body.profile).toHaveProperty('radiusPref', 25);
      expect(response.body.profile).toHaveProperty('hobbies');
      expect(Array.isArray(response.body.profile.hobbies)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/profile')
        .expect(401);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile with valid data', async () => {
      const updateData = {
        displayName: 'John Doe',
        age: 25,
        gender: 'male',
        pronouns: 'he/him',
        bio: 'Software developer who loves coding!',
        status: 'active',
        radiusPref: 50,
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.profile).toMatchObject(updateData);
    });

    it('should update profile with hobbies', async () => {
      // Get available hobbies
      const hobbiesResponse = await request(app)
        .get('/api/hobbies')
        .expect(200);

      const hobbies = hobbiesResponse.body.hobbies;
      const selectedHobbies = hobbies.slice(0, 3).map((h: any) => h.id);

      const updateData = {
        displayName: 'Jane Doe',
        hobbies: selectedHobbies,
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.profile.displayName).toBe('Jane Doe');
      expect(response.body.profile.hobbies).toHaveLength(3);
    });

    it('should return 400 for invalid age', async () => {
      const updateData = {
        age: 15, // Too young
      };

      await request(app)
        .put('/api/profile')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should return 400 for invalid gender', async () => {
      const updateData = {
        gender: 'invalid',
      };

      await request(app)
        .put('/api/profile')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .put('/api/profile')
        .send({ displayName: 'Test' })
        .expect(401);
    });

    it('should return 400 for invalid hobby IDs', async () => {
      const updateData = {
        hobbies: ['invalid-hobby-id'],
      };

      await request(app)
        .put('/api/profile')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('POST /api/profile/location', () => {
    it('should update location with valid coordinates', async () => {
      const locationData = {
        lat: 40.7128,
        lng: -74.0060,
        manualEntry: false,
      };

      const response = await request(app)
        .post('/api/profile/location')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(locationData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Location updated successfully');
      expect(response.body.location.lat).toBe(locationData.lat);
      expect(response.body.location.lng).toBe(locationData.lng);
    });

    it('should return 400 for invalid latitude', async () => {
      const locationData = {
        lat: 91, // Invalid latitude
        lng: 0,
      };

      await request(app)
        .post('/api/profile/location')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(locationData)
        .expect(400);
    });

    it('should return 400 for invalid longitude', async () => {
      const locationData = {
        lat: 0,
        lng: 181, // Invalid longitude
      };

      await request(app)
        .post('/api/profile/location')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(locationData)
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post('/api/profile/location')
        .send({ lat: 0, lng: 0 })
        .expect(401);
    });
  });

  describe('GET /api/hobbies', () => {
    it('should return all hobbies', async () => {
      const response = await request(app)
        .get('/api/hobbies')
        .expect(200);

      expect(response.body).toHaveProperty('hobbies');
      expect(Array.isArray(response.body.hobbies)).toBe(true);
      expect(response.body.hobbies.length).toBeGreaterThan(0);

      const hobby = response.body.hobbies[0];
      expect(hobby).toHaveProperty('id');
      expect(hobby).toHaveProperty('name');
      expect(hobby).toHaveProperty('description');
      expect(hobby).toHaveProperty('category');
    });

    it('should return hobbies filtered by category', async () => {
      const response = await request(app)
        .get('/api/hobbies?category=Sports')
        .expect(200);

      expect(response.body).toHaveProperty('hobbies');
      expect(Array.isArray(response.body.hobbies)).toBe(true);

      if (response.body.hobbies.length > 0) {
        response.body.hobbies.forEach((hobby: any) => {
          expect(hobby.category).toBe('Sports');
        });
      }
    });

    it('should work without authentication', async () => {
      await request(app)
        .get('/api/hobbies')
        .expect(200);
    });
  });
});