import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { DiscoveryService } from '../discovery.service.js';
import prisma from '../../lib/prisma.js';

describe('DiscoveryService', () => {
  let testUserId1: string;
  let testUserId2: string;
  let testUserId3: string;
  let profileId1: string;
  let profileId2: string;
  let profileId3: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.swipe.deleteMany({
      where: {
        OR: [
          { actorId: { contains: 'test-discovery' } },
          { targetId: { contains: 'test-discovery' } },
        ],
      },
    });
    await prisma.profile.deleteMany({
      where: {
        userId: { contains: 'test-discovery' },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'test-discovery' },
      },
    });
  });

  beforeEach(async () => {
    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'test-discovery-1@example.com',
        passwordHash: 'test',
        emailVerified: true,
      },
    });
    testUserId1 = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'test-discovery-2@example.com',
        passwordHash: 'test',
        emailVerified: true,
      },
    });
    testUserId2 = user2.id;

    const user3 = await prisma.user.create({
      data: {
        email: 'test-discovery-3@example.com',
        passwordHash: 'test',
        emailVerified: true,
      },
    });
    testUserId3 = user3.id;

    // Create test profiles with different locations
    const profile1 = await prisma.profile.create({
      data: {
        userId: testUserId1,
        displayName: 'User 1',
        age: 25,
        gender: 'male',
        status: 'active',
        locationLat: 40.7128, // New York
        locationLng: -74.0060,
        radiusPref: 25,
      },
    });
    profileId1 = profile1.id;

    const profile2 = await prisma.profile.create({
      data: {
        userId: testUserId2,
        displayName: 'User 2',
        age: 28,
        gender: 'female',
        status: 'active',
        locationLat: 40.7589, // Close to New York
        locationLng: -73.9851,
        radiusPref: 25,
      },
    });
    profileId2 = profile2.id;

    const profile3 = await prisma.profile.create({
      data: {
        userId: testUserId3,
        displayName: 'User 3',
        age: 30,
        gender: 'female',
        status: 'active',
        locationLat: 34.0522, // Los Angeles (far away)
        locationLng: -118.2437,
        radiusPref: 25,
      },
    });
    profileId3 = profile3.id;
  });

  it('should throw error when user has no location', async () => {
    // Create user without location
    const noLocationUser = await prisma.user.create({
      data: {
        email: 'test-no-location@example.com',
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

    await expect(
      DiscoveryService.getNearbyProfiles(noLocationUser.id, { limit: 10 })
    ).rejects.toThrow('User location is required for discovery');
  });

  it('should find nearby profiles within radius', async () => {
    const result = await DiscoveryService.getNearbyProfiles(testUserId1, {
      limit: 10,
    });

    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].displayName).toBe('User 2');
    expect(result.profiles[0].distance).toBeLessThan(25);
    expect(result.hasMore).toBe(false);
    expect(result.total).toBe(1);
  });

  it('should exclude already swiped profiles', async () => {
    // Create a swipe from user1 to user2
    await prisma.swipe.create({
      data: {
        actorId: testUserId1,
        targetId: testUserId2,
        direction: 'like',
      },
    });

    const result = await DiscoveryService.getNearbyProfiles(testUserId1, {
      limit: 10,
    });

    expect(result.profiles).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should filter by gender preference', async () => {
    const result = await DiscoveryService.getNearbyProfiles(testUserId1, {
      limit: 10,
      genderPreference: 'female',
    });

    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].gender).toBe('female');
  });

  it('should filter by age range', async () => {
    const result = await DiscoveryService.getNearbyProfiles(testUserId1, {
      limit: 10,
      minAge: 30,
    });

    expect(result.profiles).toHaveLength(0); // User 2 is 28, doesn't meet min age 30
  });

  it('should return pagination info correctly', async () => {
    const result = await DiscoveryService.getNearbyProfiles(testUserId1, {
      limit: 1,
      offset: 0,
    });

    expect(result.profiles).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.total).toBe(1);
  });

  it('should get discovery preferences', async () => {
    const preferences = await DiscoveryService.getDiscoveryPreferences(testUserId1);

    expect(preferences.radiusPref).toBe(25);
    expect(preferences.hasLocation).toBe(true);
  });

  it('should calculate distance correctly', async () => {
    const result = await DiscoveryService.getNearbyProfiles(testUserId1, {
      limit: 10,
    });

    // Distance between NYC coordinates should be small
    expect(result.profiles[0].distance).toBeGreaterThan(0);
    expect(result.profiles[0].distance).toBeLessThan(25);
  });

  // Cleanup
  afterEach(async () => {
    await prisma.swipe.deleteMany({
      where: {
        OR: [
          { actorId: { in: [testUserId1, testUserId2, testUserId3] } },
          { targetId: { in: [testUserId1, testUserId2, testUserId3] } },
        ],
      },
    });
    await prisma.profile.deleteMany({
      where: {
        userId: { in: [testUserId1, testUserId2, testUserId3] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [testUserId1, testUserId2, testUserId3] },
      },
    });
  });
});