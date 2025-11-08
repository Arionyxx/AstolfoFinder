import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SwipeService } from './swipe.service.js';
import prisma from '../lib/prisma.js';

describe('SwipeService', () => {
  let testUserId: string;
  let targetUserId: string;

  beforeEach(async () => {
    SwipeService.clearMessageStore();
    // Create test users
    const testUser = await prisma.user.create({
      data: {
        email: 'test-swipe-service@example.com',
        passwordHash: 'test',
        emailVerified: true,
      },
    });

    testUserId = testUser.id;

    const targetUser = await prisma.user.create({
      data: {
        email: 'test-swipe-service-target@example.com',
        passwordHash: 'test',
        emailVerified: true,
      },
    });

    targetUserId = targetUser.id;
  });

  describe('getSwipeCountToday', () => {
    it('should return 0 for user with no swipes', async () => {
      const count = await SwipeService.getSwipeCountToday(testUserId);
      expect(count).toBe(0);
    });

    it('should count swipes only from today UTC', async () => {
      // Create today's swipe
      await prisma.swipe.create({
        data: {
          actorId: testUserId,
          targetId: targetUserId,
          direction: 'like',
          swipeDate: new Date(),
        },
      });

      // Create a user for yesterday
      const user2 = await prisma.user.create({
        data: {
          email: 'test-swipe-service-yesterday@example.com',
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      // Create yesterday's swipe
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      
      await prisma.swipe.create({
        data: {
          actorId: testUserId,
          targetId: user2.id,
          direction: 'pass',
          swipeDate: yesterday,
        },
      });

      // Should only count today's swipe
      const count = await SwipeService.getSwipeCountToday(testUserId);
      expect(count).toBe(1);
    });
  });

  describe('getSwipeStats', () => {
    it('should return correct stats', async () => {
      const stats = await SwipeService.getSwipeStats(testUserId);

      expect(stats).toHaveProperty('totalSwipesToday', 0);
      expect(stats).toHaveProperty('swipesRemaining', 100);
      expect(stats).toHaveProperty('resetTime');

      const resetTime = new Date(stats.resetTime);
      const now = new Date();
      expect(resetTime.getUTCDate()).toBeGreaterThanOrEqual(now.getUTCDate());
    });

    it('should update stats after recording swipes', async () => {
      // Record 5 swipes
      for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
          data: {
            email: `test-swipe-service-stats-${i}@example.com`,
            passwordHash: 'test',
            emailVerified: true,
          },
        });

        await SwipeService.recordSwipe(testUserId, user.id, 'like');
      }

      const stats = await SwipeService.getSwipeStats(testUserId);
      expect(stats.totalSwipesToday).toBe(5);
      expect(stats.swipesRemaining).toBe(95);
    });
  });

  describe('recordSwipe', () => {
    it('should record a like swipe', async () => {
      const result = await SwipeService.recordSwipe(testUserId, targetUserId, 'like');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('swipeId');
      expect(result).toHaveProperty('matchCreated', false);
      expect(result.message).toContain('like');

      const swipe = await prisma.swipe.findUnique({
        where: {
          actorId_targetId: {
            actorId: testUserId,
            targetId: targetUserId,
          },
        },
      });

      expect(swipe).toBeDefined();
      expect(swipe?.direction).toBe('like');
    });

    it('should record a pass swipe', async () => {
      const result = await SwipeService.recordSwipe(testUserId, targetUserId, 'pass');

      expect(result.success).toBe(true);
      expect(result.message).toContain('pass');

      const swipe = await prisma.swipe.findUnique({
        where: {
          actorId_targetId: {
            actorId: testUserId,
            targetId: targetUserId,
          },
        },
      });

      expect(swipe?.direction).toBe('pass');
    });

    it('should throw error when swiping on yourself', async () => {
      await expect(SwipeService.recordSwipe(testUserId, testUserId, 'like')).rejects.toThrow(
        'Cannot swipe on yourself'
      );
    });

    it('should throw error when target does not exist', async () => {
      await expect(SwipeService.recordSwipe(testUserId, 'non-existent-id', 'like')).rejects.toThrow(
        'Target user not found'
      );
    });

    it('should throw error when exceeding daily limit', async () => {
      // Create 101 target users and swipe on all but the last
      const users = [];
      for (let i = 0; i < 101; i++) {
        const user = await prisma.user.create({
          data: {
            email: `test-swipe-service-limit-${i}@example.com`,
            passwordHash: 'test',
            emailVerified: true,
          },
        });
        users.push(user);
      }

      // Record 100 swipes
      for (let i = 0; i < 100; i++) {
        await SwipeService.recordSwipe(testUserId, users[i].id, 'like');
      }

      // 101st should fail
      await expect(SwipeService.recordSwipe(testUserId, users[100].id, 'like')).rejects.toThrow(
        'Daily swipe limit'
      );
    });

    it('should throw error on duplicate swipe', async () => {
      // First swipe
      await SwipeService.recordSwipe(testUserId, targetUserId, 'like');

      // Second swipe should fail
      await expect(SwipeService.recordSwipe(testUserId, targetUserId, 'pass')).rejects.toThrow(
        'already swiped'
      );
    });

    it('should create match on mutual like', async () => {
      // Target likes actor first
      await prisma.swipe.create({
        data: {
          actorId: targetUserId,
          targetId: testUserId,
          direction: 'like',
          swipeDate: new Date(),
        },
      });

      // Actor likes target
      const result = await SwipeService.recordSwipe(testUserId, targetUserId, 'like');

      expect(result.matchCreated).toBe(true);
      expect(result.message).toContain('Mutual like');

      // Check match was created
      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: testUserId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: testUserId },
          ],
        },
      });

      expect(match).toBeDefined();
    });

    it('should not create match on one-way like', async () => {
      const result = await SwipeService.recordSwipe(testUserId, targetUserId, 'like');

      expect(result.matchCreated).toBe(false);

      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: testUserId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: testUserId },
          ],
        },
      });

      expect(match).toBeNull();
    });

    it('should not create match on pass', async () => {
      // Target likes actor
      await prisma.swipe.create({
        data: {
          actorId: targetUserId,
          targetId: testUserId,
          direction: 'like',
          swipeDate: new Date(),
        },
      });

      // Actor passes
      const result = await SwipeService.recordSwipe(testUserId, targetUserId, 'pass');

      expect(result.matchCreated).toBe(false);

      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: testUserId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: testUserId },
          ],
        },
      });

      expect(match).toBeNull();
    });
  });

  describe('getUserMatches', () => {
    it('should return empty array when no matches', async () => {
      const matches = await SwipeService.getUserMatches(testUserId);
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBe(0);
    });

    it('should return user matches', async () => {
      // Create a match
      const match = await prisma.match.create({
        data: {
          user1Id: testUserId,
          user2Id: targetUserId,
        },
      });

      // Create profile for target
      await prisma.profile.create({
        data: {
          userId: targetUserId,
          displayName: 'Test Match',
          status: 'active',
        },
      });

      const matches = await SwipeService.getUserMatches(testUserId);

      expect(matches.length).toBe(1);
      expect(matches[0].id).toBe(match.id);
      expect(matches[0].matchedWithId).toBe(targetUserId);
      expect(matches[0].matchedWithName).toBe('Test Match');
    });

    it('should return matches for both users', async () => {
      const match = await prisma.match.create({
        data: {
          user1Id: testUserId,
          user2Id: targetUserId,
        },
      });

      const testUserMatches = await SwipeService.getUserMatches(testUserId);
      const targetUserMatches = await SwipeService.getUserMatches(targetUserId);

      expect(testUserMatches.length).toBe(1);
      expect(targetUserMatches.length).toBe(1);
      expect(testUserMatches[0].id).toBe(match.id);
      expect(targetUserMatches[0].id).toBe(match.id);
    });
  });

  describe('getMatchDetails', () => {
    it('should throw error when match not found', async () => {
      await expect(SwipeService.getMatchDetails('non-existent-id', testUserId)).rejects.toThrow(
        'Match not found'
      );
    });

    it('should throw error when user not in match', async () => {
      const user3 = await prisma.user.create({
        data: {
          email: 'test-swipe-service-user3@example.com',
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      const match = await prisma.match.create({
        data: {
          user1Id: targetUserId,
          user2Id: user3.id,
        },
      });

      await expect(SwipeService.getMatchDetails(match.id, testUserId)).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should return match details', async () => {
      // Create profile for target
      await prisma.profile.create({
        data: {
          userId: targetUserId,
          displayName: 'Match Detail Test',
          age: 26,
          gender: 'female',
          bio: 'Test bio',
          status: 'active',
        },
      });

      const match = await prisma.match.create({
        data: {
          user1Id: testUserId,
          user2Id: targetUserId,
        },
      });

      const details = await SwipeService.getMatchDetails(match.id, testUserId);

      expect(details.id).toBe(match.id);
      expect(details.matchedWith.id).toBe(targetUserId);
      expect(details.matchedWith.displayName).toBe('Match Detail Test');
      expect(details.matchedWith.age).toBe(26);
      expect(details.matchedWith.gender).toBe('female');
      expect(details.matchedWith.bio).toBe('Test bio');
      expect(details).toHaveProperty('createdAt');
      expect(details).toHaveProperty('lastInteraction');
    });
  });

  describe('match messaging placeholder', () => {
    let matchId: string;

    beforeEach(async () => {
      const match = await prisma.match.create({
        data: {
          user1Id: testUserId,
          user2Id: targetUserId,
        },
      });

      matchId = match.id;
    });

    it('returns empty array when no messages exist', async () => {
      const messages = await SwipeService.getMatchMessages(matchId, testUserId);
      expect(messages).toEqual([]);
    });

    it('adds and retrieves trimmed messages for both participants', async () => {
      const stored = await SwipeService.addMatchMessage(matchId, testUserId, ' Hello there ');

      expect(stored.content).toBe('Hello there');
      expect(stored.matchId).toBe(matchId);
      expect(stored.senderId).toBe(testUserId);
      expect(new Date(stored.createdAt).toISOString()).toBe(stored.createdAt);

      const messagesForSelf = await SwipeService.getMatchMessages(matchId, testUserId);
      expect(messagesForSelf).toHaveLength(1);
      expect(messagesForSelf[0].content).toBe('Hello there');

      const messagesForPartner = await SwipeService.getMatchMessages(matchId, targetUserId);
      expect(messagesForPartner).toHaveLength(1);
      expect(messagesForPartner[0].content).toBe('Hello there');
      expect(messagesForPartner[0].id).toBe(stored.id);

      const refreshedMatch = await prisma.match.findUnique({ where: { id: matchId } });
      expect(refreshedMatch?.lastInteraction).not.toBeNull();
    });

    it('prevents users outside the match from accessing messages', async () => {
      const outsider = await prisma.user.create({
        data: {
          email: 'test-swipe-service-outsider@example.com',
          passwordHash: 'test',
          emailVerified: true,
        },
      });

      await expect(SwipeService.getMatchMessages(matchId, outsider.id)).rejects.toThrow('Unauthorized');
      await expect(SwipeService.addMatchMessage(matchId, outsider.id, 'Hi there')).rejects.toThrow('Unauthorized');
    });

    it('enforces message content constraints', async () => {
      await expect(SwipeService.addMatchMessage(matchId, testUserId, '  ')).rejects.toThrow(
        'Message content cannot be empty'
      );

      const longMessage = 'a'.repeat(1001);
      await expect(SwipeService.addMatchMessage(matchId, testUserId, longMessage)).rejects.toThrow(
        'Message content must be 1000 characters or less'
      );
    });
  });

  afterEach(async () => {
    SwipeService.clearMessageStore();
    // Clean up test data
    await prisma.swipe.deleteMany({
      where: {
        OR: [
          { actorId: { contains: 'test-swipe-service' } },
          { targetId: { contains: 'test-swipe-service' } },
        ],
      },
    });
    await prisma.match.deleteMany({
      where: {
        OR: [
          { user1Id: { contains: 'test-swipe-service' } },
          { user2Id: { contains: 'test-swipe-service' } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'test-swipe-service' },
      },
    });
  });
});
