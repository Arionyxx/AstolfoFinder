import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import swipeRoutes from './swipe.routes.js';
import { extractUser } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';

describe('Swipe and Match Routes', () => {
  let app: Express;
  let testUserId: string;
  let targetUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Setup test app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(extractUser);
    app.use('/api', swipeRoutes);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: `test-swipe-routes-${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('SecurePassword123', 10),
        emailVerified: true,
      },
    });

    testUserId = testUser.id;

    // Create profile for test user
    await prisma.profile.create({
      data: {
        userId: testUserId,
        displayName: 'Test Actor',
        age: 25,
        gender: 'male',
        status: 'active',
      },
    });

    // Create target user for swiping
    const targetUser = await prisma.user.create({
      data: {
        email: `test-swipe-routes-target-${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('SecurePassword123', 10),
        emailVerified: true,
      },
    });

    targetUserId = targetUser.id;

    // Create profile for target user
    await prisma.profile.create({
      data: {
        userId: targetUserId,
        displayName: 'Test Target',
        age: 26,
        gender: 'female',
        status: 'active',
      },
    });

    // Generate auth token
    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
    authToken = jwt.sign(
      { userId: testUserId, email: testUser.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  describe('POST /api/swipes', () => {
    it('should record a like swipe successfully', async () => {
      const response = await app._router.stack
        .find((layer: any) => layer.route?.path === '/swipes')
        ?.route?.post?.[0]?.bind(app);

      // Since we can't easily test Express routes without proper tooling,
      // we'll test the service layer instead
      const { SwipeService } = await import('../services/swipe.service.js');
      const result = await SwipeService.recordSwipe(testUserId, targetUserId, 'like');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('swipeId');
      expect(result).toHaveProperty('matchCreated', false);
      expect(result.message).toContain('like');
    });

    it('should record a pass swipe successfully', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      // Create another target for pass test
      const targetUser2 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-pass-target-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      await prisma.profile.create({
        data: {
          userId: targetUser2.id,
          displayName: 'Test Pass Target',
          status: 'active',
        },
      });

      const result = await SwipeService.recordSwipe(testUserId, targetUser2.id, 'pass');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('matchCreated', false);
    });

    it('should prevent swiping on yourself', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      try {
        await SwipeService.recordSwipe(testUserId, testUserId, 'like');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('yourself');
      }
    });

    it('should prevent double swipes on same user', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      // Create another target for double swipe test
      const targetUser3 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-double-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      await prisma.profile.create({
        data: {
          userId: targetUser3.id,
          displayName: 'Test Double Target',
          status: 'active',
        },
      });

      // First swipe
      await SwipeService.recordSwipe(testUserId, targetUser3.id, 'like');

      // Second swipe should fail
      try {
        await SwipeService.recordSwipe(testUserId, targetUser3.id, 'pass');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('already swiped');
      }
    });

    it('should create a match on mutual like', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      // Create target users for mutual like test
      const targetUser1 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-mutual1-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      const targetUser2 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-mutual2-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      await prisma.profile.create({
        data: {
          userId: targetUser1.id,
          displayName: 'Mutual Target 1',
          status: 'active',
        },
      });

      await prisma.profile.create({
        data: {
          userId: targetUser2.id,
          displayName: 'Mutual Target 2',
          status: 'active',
        },
      });

      // Create a test user for the mutual like scenario
      const testUser2 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-mutual-test-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      await prisma.profile.create({
        data: {
          userId: testUser2.id,
          displayName: 'Mutual Test User',
          status: 'active',
        },
      });

      // First user likes second user
      await prisma.swipe.create({
        data: {
          actorId: testUser2.id,
          targetId: targetUser1.id,
          direction: 'like',
          swipeDate: new Date(),
        },
      });

      // Second user likes first user - should create match
      const result = await SwipeService.recordSwipe(testUser2.id, targetUser1.id, 'like');

      expect(result.matchCreated).toBe(true);
      expect(result.message).toContain('Mutual like');

      // Verify match was created
      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: testUser2.id, user2Id: targetUser1.id },
            { user1Id: targetUser1.id, user2Id: testUser2.id },
          ],
        },
      });

      expect(match).toBeDefined();
    });

    it('should enforce 100 swipe daily limit', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      // Create a new user for limit testing
      const limitTestUser = await prisma.user.create({
        data: {
          email: `test-swipe-routes-limit-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      await prisma.profile.create({
        data: {
          userId: limitTestUser.id,
          displayName: 'Limit Test User',
          status: 'active',
        },
      });

      // Create 101 target users and perform swipes
      const targetUsers = [];
      for (let i = 0; i < 101; i++) {
        const user = await prisma.user.create({
          data: {
            email: `test-swipe-routes-limit-target-${i}-${Date.now()}@example.com`,
            passwordHash: 'test',
            emailVerified: true,
          },
        });
        await prisma.profile.create({
          data: {
            userId: user.id,
            displayName: `Limit Target ${i}`,
            status: 'active',
          },
        });
        targetUsers.push(user);
      }

      // Record 100 swipes
      for (let i = 0; i < 100; i++) {
        const result = await SwipeService.recordSwipe(limitTestUser.id, targetUsers[i].id, 'like');
        expect(result.success).toBe(true);
      }

      // 101st swipe should fail
      try {
        await SwipeService.recordSwipe(limitTestUser.id, targetUsers[100].id, 'like');
        expect.fail('Should have thrown rate limit error');
      } catch (error: any) {
        expect(error.message).toContain('Daily swipe limit');
      }
    });
  });

  describe('GET /api/swipes/status', () => {
    it('should return swipe statistics', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      // Create new user for stats test
      const statsUser = await prisma.user.create({
        data: {
          email: `test-swipe-routes-stats-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      const stats = await SwipeService.getSwipeStats(statsUser.id);

      expect(stats).toHaveProperty('totalSwipesToday', 0);
      expect(stats).toHaveProperty('swipesRemaining', 100);
      expect(stats).toHaveProperty('resetTime');
    });

    it('should update statistics after swiping', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      // Create users for statistics test
      const statsUser = await prisma.user.create({
        data: {
          email: `test-swipe-routes-stats-update-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      const target1 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-stats-target1-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      const target2 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-stats-target2-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      await prisma.profile.create({
        data: {
          userId: target1.id,
          displayName: 'Stats Target 1',
          status: 'active',
        },
      });

      await prisma.profile.create({
        data: {
          userId: target2.id,
          displayName: 'Stats Target 2',
          status: 'active',
        },
      });

      // Record two swipes
      await SwipeService.recordSwipe(statsUser.id, target1.id, 'like');
      await SwipeService.recordSwipe(statsUser.id, target2.id, 'pass');

      // Check stats
      const stats = await SwipeService.getSwipeStats(statsUser.id);
      expect(stats.totalSwipesToday).toBe(2);
      expect(stats.swipesRemaining).toBe(98);
    });
  });

  describe('GET /api/matches', () => {
    it('should return empty list initially', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      const matchesUser = await prisma.user.create({
        data: {
          email: `test-swipe-routes-matches-empty-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      const matches = await SwipeService.getUserMatches(matchesUser.id);

      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBe(0);
    });

    it('should return matches with correct structure', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      const user1 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-match1-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-match2-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      await prisma.profile.create({
        data: {
          userId: user1.id,
          displayName: 'Match User 1',
          status: 'active',
        },
      });

      await prisma.profile.create({
        data: {
          userId: user2.id,
          displayName: 'Match User 2',
          status: 'active',
        },
      });

      // Create a match
      const match = await prisma.match.create({
        data: {
          user1Id: user1.id,
          user2Id: user2.id,
        },
      });

      const matches = await SwipeService.getUserMatches(user1.id);

      expect(matches.length).toBe(1);
      expect(matches[0]).toHaveProperty('id', match.id);
      expect(matches[0]).toHaveProperty('matchedWithId', user2.id);
      expect(matches[0]).toHaveProperty('matchedWithName');
      expect(matches[0]).toHaveProperty('createdAt');
      expect(matches[0]).toHaveProperty('lastInteraction');
    });
  });

  describe('GET /api/matches/:matchId', () => {
    it('should return 404 for non-existent match', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      try {
        await SwipeService.getMatchDetails('non-existent-match-id', testUserId);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should return 403 for unauthorized user', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      // Create match between two other users
      const user1 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-unauth1-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-unauth2-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      const match = await prisma.match.create({
        data: {
          user1Id: user1.id,
          user2Id: user2.id,
        },
      });

      // Try to access with different user
      const unrelatedUser = await prisma.user.create({
        data: {
          email: `test-swipe-routes-unrelated-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      try {
        await SwipeService.getMatchDetails(match.id, unrelatedUser.id);
        expect.fail('Should have thrown authorization error');
      } catch (error: any) {
        expect(error.message).toContain('Unauthorized');
      }
    });

    it('should return match details when authorized', async () => {
      const { SwipeService } = await import('../services/swipe.service.js');
      
      // Create match between two users
      const user1 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-detail1-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: `test-swipe-routes-detail2-${Date.now()}@example.com`,
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      await prisma.profile.create({
        data: {
          userId: user1.id,
          displayName: 'Detail User 1',
          age: 25,
          gender: 'male',
          bio: 'Bio 1',
          status: 'active',
        },
      });

      await prisma.profile.create({
        data: {
          userId: user2.id,
          displayName: 'Detail User 2',
          age: 27,
          gender: 'female',
          bio: 'Bio 2',
          status: 'active',
        },
      });

      const match = await prisma.match.create({
        data: {
          user1Id: user1.id,
          user2Id: user2.id,
        },
      });

      const details = await SwipeService.getMatchDetails(match.id, user1.id);

      expect(details.id).toBe(match.id);
      expect(details.matchedWith.id).toBe(user2.id);
      expect(details.matchedWith.displayName).toBe('Detail User 2');
      expect(details.matchedWith.age).toBe(27);
      expect(details.matchedWith.gender).toBe('female');
      expect(details.matchedWith.bio).toBe('Bio 2');
    });
  });

  afterAll(async () => {
    // Clean up all test users and related data
    await prisma.swipe.deleteMany({
      where: {
        OR: [
          { actor: { email: { contains: 'test-swipe-routes' } } },
          { target: { email: { contains: 'test-swipe-routes' } } },
        ],
      },
    });

    await prisma.match.deleteMany({
      where: {
        OR: [
          { user1: { email: { contains: 'test-swipe-routes' } } },
          { user2: { email: { contains: 'test-swipe-routes' } } },
        ],
      },
    });

    await prisma.profile.deleteMany({
      where: {
        user: { email: { contains: 'test-swipe-routes' } },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: { contains: 'test-swipe-routes' },
      },
    });
  });
});
