import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import prisma from '../../lib/prisma.js';

describe('Discovery Routes', () => {
  let authToken: string;
  let testUserId: string;
  let testProfileId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.swipe.deleteMany({
      where: {
        OR: [
          { actorId: { contains: 'test-discovery-route' } },
          { targetId: { contains: 'test-discovery-route' } },
        ],
      },
    });
    await prisma.profile.deleteMany({
      where: {
        userId: { contains: 'test-discovery-route' },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'test-discovery-route' },
      },
    });
  });

  beforeEach(async () => {
    // Create and authenticate test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test-discovery-route@example.com',
        password: 'testpassword123',
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-discovery-route@example.com',
        password: 'testpassword123',
      });

    // Extract auth token from cookies
    const setCookieHeader = loginResponse.headers['set-cookie'];
    const authCookie = setCookieHeader?.find(cookie => 
      cookie.startsWith('accessToken=')
    );
    authToken = authCookie?.split(';')[0] || '';

    // Get user ID from token or create profile
    const profile = await prisma.profile.create({
      data: {
        userId: registerResponse.body.user.id,
        displayName: 'Test User',
        age: 25,
        gender: 'male',
        status: 'active',
        locationLat: 40.7128, // New York
        locationLng: -74.0060,
        radiusPref: 25,
      },
    });

    testProfileId = profile.id;
    testUserId = registerResponse.body.user.id;

    // Create another user for testing discovery
    const otherUser = await prisma.user.create({
      data: {
        email: 'test-discovery-target@example.com',
        passwordHash: 'test',
        emailVerified: true,
      },
    });

    await prisma.profile.create({
      data: {
        userId: otherUser.id,
        displayName: 'Nearby User',
        age: 28,
        gender: 'female',
        status: 'active',
        locationLat: 40.7589, // Close to New York
        locationLng: -73.9851,
        radiusPref: 25,
      },
    });
  });

  it('should require authentication for discovery profiles', async () => {
    const response = await request(app)
      .get('/api/discovery/profiles')
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('should get discovery profiles with authentication', async () => {
    const response = await request(app)
      .get('/api/discovery/profiles')
      .set('Cookie', authToken)
      .expect(200);

    expect(response.body).toHaveProperty('profiles');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.profiles)).toBe(true);
    expect(response.body.pagination).toHaveProperty('hasMore');
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('offset');
  });

  it('should validate query parameters', async () => {
    const response = await request(app)
      .get('/api/discovery/profiles?limit=invalid')
      .set('Cookie', authToken)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('details');
  });

  it('should apply filters correctly', async () => {
    const response = await request(app)
      .get('/api/discovery/profiles?genderPreference=female&minAge=25&maxAge=30')
      .set('Cookie', authToken)
      .expect(200);

    expect(response.body.profiles).toBeDefined();
    // All returned profiles should match the filters
    response.body.profiles.forEach((profile: any) => {
      expect(profile.gender).toBe('female');
      expect(profile.age).toBeGreaterThanOrEqual(25);
      expect(profile.age).toBeLessThanOrEqual(30);
    });
  });

  it('should require authentication for discovery preferences', async () => {
    const response = await request(app)
      .get('/api/discovery/preferences')
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('should get discovery preferences with authentication', async () => {
    const response = await request(app)
      .get('/api/discovery/preferences')
      .set('Cookie', authToken)
      .expect(200);

    expect(response.body).toHaveProperty('preferences');
    expect(response.body.preferences).toHaveProperty('radiusPref');
    expect(response.body.preferences).toHaveProperty('hasLocation');
    expect(response.body.preferences.radiusPref).toBe(25);
    expect(response.body.preferences.hasLocation).toBe(true);
  });

  it('should return error when user has no location', async () => {
    // Create user without location
    const noLocationUser = await prisma.user.create({
      data: {
        email: 'test-no-location-route@example.com',
        passwordHash: 'test',
        emailVerified: true,
      },
    });

    await prisma.profile.create({
      data: {
        userId: noLocationUser.id,
        displayName: 'No Location User',
        status: 'active',
      },
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-no-location-route@example.com',
        password: 'testpassword123',
      });

    const setCookieHeader = loginResponse.headers['set-cookie'];
    const authCookie = setCookieHeader?.find(cookie => 
      cookie.startsWith('accessToken=')
    );

    const response = await request(app)
      .get('/api/discovery/profiles')
      .set('Cookie', authCookie || '')
      .expect(400);

    expect(response.body.error).toContain('Location is required for discovery');
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.swipe.deleteMany({
      where: {
        OR: [
          { actorId: { contains: 'test-discovery-route' } },
          { targetId: { contains: 'test-discovery-route' } },
        ],
      },
    });
    await prisma.profile.deleteMany({
      where: {
        userId: { contains: 'test-discovery-route' },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'test-discovery-route' },
      },
    });
  });
});