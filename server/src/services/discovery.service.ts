import prisma from '../lib/prisma.js';
import { DiscoveryQueryInput } from '../schemas/discovery.js';

export interface DiscoveryProfile {
  id: string;
  userId: string;
  displayName: string | null;
  age: number | null;
  gender: string | null;
  pronouns: string | null;
  bio: string | null;
  status: string | null;
  locationLat: number | null;
  locationLng: number | null;
  distance: number | null;
  sharedHobbies: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string | null;
  }>;
  photos: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
  }>;
}

export interface DiscoveryResult {
  profiles: DiscoveryProfile[];
  hasMore: boolean;
  total: number;
}

export class DiscoveryService {
  /**
   * Calculate Haversine distance between two points on Earth
   * Returns distance in miles
   */
  private static haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get nearby profiles for discovery feed
   */
  static async getNearbyProfiles(
    userId: string,
    query: DiscoveryQueryInput
  ): Promise<DiscoveryResult> {
    // Get user's profile and location
    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        locationLat: true,
        locationLng: true,
        radiusPref: true,
      },
    });

    if (!userProfile || !userProfile.locationLat || !userProfile.locationLng) {
      throw new Error('User location is required for discovery');
    }

    const radius = query.radius || userProfile.radiusPref || 25;
    const offset = query.offset || 0;
    const limit = Math.min(query.limit || 20, 50); // Max 50 profiles per request

    // Get already swiped user IDs
    const swipedProfiles = await prisma.swipe.findMany({
      where: { actorId: userId },
      select: { targetId: true },
    });
    const swipedUserIds = new Set(swipedProfiles.map(s => s.targetId));

    // Get all potential candidates with their data
    const candidates = await prisma.profile.findMany({
      where: {
        userId: { not: userId }, // Exclude self
        status: 'active',
        locationLat: { not: null },
        locationLng: { not: null },
        userId: { notIn: Array.from(swipedUserIds) }, // Exclude already swiped
      },
      include: {
        hobbies: {
          include: {
            hobby: true,
          },
        },
        photos: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    // Filter by distance and apply additional filters
    let filteredCandidates = candidates.filter(profile => {
      if (!profile.locationLat || !profile.locationLng) return false;

      const distance = this.haversineDistance(
        userProfile.locationLat!,
        userProfile.locationLng!,
        profile.locationLat,
        profile.locationLng
      );

      // Distance filter
      if (distance > radius) return false;

      // Gender preference filter
      if (query.genderPreference && profile.gender !== query.genderPreference) {
        return false;
      }

      // Age range filter
      if (query.minAge && (!profile.age || profile.age < query.minAge)) {
        return false;
      }
      if (query.maxAge && (!profile.age || profile.age > query.maxAge)) {
        return false;
      }

      // Same city filter (simplified - could use reverse geocoding in production)
      if (query.sameCity && userProfile.locationLat && userProfile.locationLng) {
        const cityDistance = this.haversineDistance(
          userProfile.locationLat,
          userProfile.locationLng,
          profile.locationLat,
          profile.locationLng
        );
        // Consider same city if within 10 miles
        if (cityDistance > 10) return false;
      }

      return true;
    });

    // Get user's hobbies for shared hobby calculation
    const userHobbies = await prisma.profileHobby.findMany({
      where: { profileId: userProfile.id },
      select: { hobbyId: true },
    });
    const userHobbyIds = new Set(userHobbies.map(uh => uh.hobbyId));

    // Transform results and calculate shared hobbies
    const transformedProfiles: DiscoveryProfile[] = filteredCandidates
      .map(profile => {
        const distance = this.haversineDistance(
          userProfile.locationLat!,
          userProfile.locationLng!,
          profile.locationLat!,
          profile.locationLng!
        );

        const sharedHobbies = profile.hobbies
          .filter(ph => userHobbyIds.has(ph.hobbyId))
          .map(ph => ({
            id: ph.hobby.id,
            name: ph.hobby.name,
            description: ph.hobby.description,
            category: ph.hobby.category,
          }));

        return {
          id: profile.id,
          userId: profile.userId,
          displayName: profile.displayName,
          age: profile.age,
          gender: profile.gender,
          pronouns: profile.pronouns,
          bio: profile.bio,
          status: profile.status,
          locationLat: profile.locationLat,
          locationLng: profile.locationLng,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
          sharedHobbies,
          photos: profile.photos.map(photo => ({
            id: photo.id,
            url: photo.url,
            isPrimary: photo.isPrimary,
          })),
        };
      })
      // Sort by distance and number of shared hobbies
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        
        // Primary sort by distance
        const distanceDiff = a.distance - b.distance;
        if (distanceDiff !== 0) return distanceDiff;
        
        // Secondary sort by number of shared hobbies (descending)
        return b.sharedHobbies.length - a.sharedHobbies.length;
      });

    // Apply pagination
    const paginatedProfiles = transformedProfiles.slice(offset, offset + limit);
    const hasMore = offset + limit < transformedProfiles.length;

    return {
      profiles: paginatedProfiles,
      hasMore,
      total: transformedProfiles.length,
    };
  }

  /**
   * Get user's discovery preferences
   */
  static async getDiscoveryPreferences(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        radiusPref: true,
        locationLat: true,
        locationLng: true,
      },
    });

    return {
      radiusPref: profile?.radiusPref || 25,
      hasLocation: !!(profile?.locationLat && profile?.locationLng),
    };
  }
}