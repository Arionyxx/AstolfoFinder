import { randomUUID } from 'crypto';
import prisma from '../lib/prisma.js';

export interface SwipeResult {
  success: boolean;
  swipeId: string;
  matchCreated?: boolean;
  message: string;
}

export interface SwipeStats {
  totalSwipesToday: number;
  swipesRemaining: number;
  resetTime: string;
}

export interface MatchInfo {
  id: string;
  matchedWithId: string;
  matchedWithName: string | null;
  createdAt: string;
  lastInteraction: string | null;
}

export interface MatchMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

type StoredMatchMessage = {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: Date;
};

export class SwipeService {
  private static readonly DAILY_SWIPE_LIMIT = 100;
  private static matchMessageStore: Map<string, StoredMatchMessage[]> = new Map();

  private static ensureMessageStore(matchId: string): StoredMatchMessage[] {
    if (!this.matchMessageStore.has(matchId)) {
      this.matchMessageStore.set(matchId, []);
    }

    return this.matchMessageStore.get(matchId)!;
  }

  private static toMatchMessage(message: StoredMatchMessage): MatchMessage {
    return {
      id: message.id,
      matchId: message.matchId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  }

  private static async assertMatchParticipant(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new Error('Unauthorized to view this match');
    }

    return match;
  }

  /**
   * Exposed for testing to ensure clean slate between suites
   */
  static clearMessageStore(): void {
    this.matchMessageStore.clear();
  }

  /**
   * Get today's date in UTC (without time component)
   */
  private static getTodayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  /**
   * Get tomorrow's date in UTC (for reset time calculation)
   */
  private static getTomorrowUtc(): Date {
    const today = this.getTodayUtc();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow;
  }

  /**
   * Get swipe count for today (UTC)
   */
  static async getSwipeCountToday(userId: string): Promise<number> {
    const todayUtc = this.getTodayUtc();
    const tomorrowUtc = this.getTomorrowUtc();

    const count = await prisma.swipe.count({
      where: {
        actorId: userId,
        swipeDate: {
          gte: todayUtc,
          lt: tomorrowUtc,
        },
      },
    });

    return count;
  }

  /**
   * Get swipe statistics for user
   */
  static async getSwipeStats(userId: string): Promise<SwipeStats> {
    const totalSwipesToday = await this.getSwipeCountToday(userId);
    const swipesRemaining = Math.max(0, this.DAILY_SWIPE_LIMIT - totalSwipesToday);
    const resetTime = this.getTomorrowUtc().toISOString();

    return {
      totalSwipesToday,
      swipesRemaining,
      resetTime,
    };
  }

  /**
   * Record a swipe action
   * Returns SwipeResult with information about the swipe and any match created
   */
  static async recordSwipe(
    actorId: string,
    targetId: string,
    direction: 'like' | 'pass'
  ): Promise<SwipeResult> {
    // Validate that actor and target are different
    if (actorId === targetId) {
      throw new Error('Cannot swipe on yourself');
    }

    // Check if target exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Check daily limit
    const swipesCount = await this.getSwipeCountToday(actorId);
    if (swipesCount >= this.DAILY_SWIPE_LIMIT) {
      throw new Error(`Daily swipe limit of ${this.DAILY_SWIPE_LIMIT} reached. Limit resets at midnight UTC.`);
    }

    // Check if user has already swiped on this target
    const existingSwipe = await prisma.swipe.findUnique({
      where: {
        actorId_targetId: {
          actorId,
          targetId,
        },
      },
    });

    if (existingSwipe) {
      throw new Error('You have already swiped on this user');
    }

    // Record the swipe
    const swipe = await prisma.swipe.create({
      data: {
        actorId,
        targetId,
        direction,
        swipeDate: this.getTodayUtc(),
      },
    });

    let matchCreated = false;
    let message = `Swiped ${direction}`;

    // If it's a like, check for mutual like
    if (direction === 'like') {
      const reverseSwipe = await prisma.swipe.findUnique({
        where: {
          actorId_targetId: {
            actorId: targetId,
            targetId: actorId,
          },
        },
      });

      // If target also liked actor, create a match
      if (reverseSwipe && reverseSwipe.direction === 'like') {
        const existingMatch = await prisma.match.findUnique({
          where: {
            user1Id_user2Id: {
              user1Id: actorId < targetId ? actorId : targetId,
              user2Id: actorId < targetId ? targetId : actorId,
            },
          },
        });

        if (!existingMatch) {
          // Create match - ensure consistent ordering (lower ID first)
          const [user1Id, user2Id] = actorId < targetId ? [actorId, targetId] : [targetId, actorId];
          
          await prisma.match.create({
            data: {
              user1Id,
              user2Id,
              lastInteraction: new Date(),
            },
          });

          matchCreated = true;
          message = 'Mutual like! Match created';

          // TODO: Send notification/event to both users
          // This is a placeholder for notification system
          this.emitMatchNotification(actorId, targetId);
        }
      }
    }

    return {
      success: true,
      swipeId: swipe.id,
      matchCreated,
      message,
    };
  }

  /**
   * Placeholder for notification system
   * In a real system, this would emit events, send push notifications, or queue messages
   */
  private static emitMatchNotification(userId1: string, userId2: string): void {
    // TODO: Implement notification system
    // Examples:
    // - Queue message to message broker (Redis, RabbitMQ, etc.)
    // - Send push notification via service (Firebase, OneSignal, etc.)
    // - Emit WebSocket event
    // - Send email notification
    console.log(`[Match notification] Users ${userId1} and ${userId2} matched`);
  }

  /**
   * Get all matches for a user
   */
  static async getUserMatches(userId: string): Promise<MatchInfo[]> {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          include: {
            profile: {
              select: { displayName: true },
            },
          },
        },
        user2: {
          include: {
            profile: {
              select: { displayName: true },
            },
          },
        },
      },
      orderBy: {
        lastInteraction: 'desc',
      },
    });

    return matches.map(match => {
      const isUser1 = match.user1Id === userId;
      const otherUser = isUser1 ? match.user2 : match.user1;
      
      return {
        id: match.id,
        matchedWithId: otherUser.id,
        matchedWithName: otherUser.profile?.displayName || null,
        createdAt: match.createdAt.toISOString(),
        lastInteraction: match.lastInteraction?.toISOString() || null,
      };
    });
  }

  /**
   * Get match details
   */
  static async getMatchDetails(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user1: {
          include: {
            profile: {
              select: {
                displayName: true,
                age: true,
                gender: true,
                bio: true,
                photos: {
                  where: { isPrimary: true },
                  select: { url: true },
                },
              },
            },
          },
        },
        user2: {
          include: {
            profile: {
              select: {
                displayName: true,
                age: true,
                gender: true,
                bio: true,
                photos: {
                  where: { isPrimary: true },
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Verify user is part of this match
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new Error('Unauthorized to view this match');
    }

    const otherUser = match.user1Id === userId ? match.user2 : match.user1;

    return {
      id: match.id,
      matchedWith: {
        id: otherUser.id,
        displayName: otherUser.profile?.displayName || null,
        age: otherUser.profile?.age || null,
        gender: otherUser.profile?.gender || null,
        bio: otherUser.profile?.bio || null,
        primaryPhoto: otherUser.profile?.photos?.[0]?.url || null,
      },
      createdAt: match.createdAt.toISOString(),
      lastInteraction: match.lastInteraction?.toISOString() || null,
    };
  }

  static async getMatchMessages(matchId: string, userId: string): Promise<MatchMessage[]> {
    const match = await this.assertMatchParticipant(matchId, userId);
    const messages = this.ensureMessageStore(match.id);

    return messages
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(message => this.toMatchMessage(message));
  }

  static async addMatchMessage(matchId: string, senderId: string, content: string): Promise<MatchMessage> {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new Error('Message content cannot be empty');
    }

    if (trimmedContent.length > 1000) {
      throw new Error('Message content must be 1000 characters or less');
    }

    const match = await this.assertMatchParticipant(matchId, senderId);
    const createdAt = new Date();

    const message: StoredMatchMessage = {
      id: randomUUID(),
      matchId: match.id,
      senderId,
      content: trimmedContent,
      createdAt,
    };

    const messages = this.ensureMessageStore(match.id);
    messages.push(message);

    await prisma.match.update({
      where: { id: match.id },
      data: { lastInteraction: createdAt },
    });

    return this.toMatchMessage(message);
  }
}
