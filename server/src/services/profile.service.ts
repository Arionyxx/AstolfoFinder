import prisma from '../lib/prisma.js';
import { ProfileUpdateInput, ProfileLocationInput } from '../schemas/profile.js';

export class ProfileService {
  /**
   * Get user profile by user ID
   */
  static async getProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        hobbies: {
          include: {
            hobby: true,
          },
        },
      },
    });

    if (!profile) {
      // Create a default profile if it doesn't exist
      return await this.createDefaultProfile(userId);
    }

    return profile;
  }

  /**
   * Create a default profile for a new user
   */
  static async createDefaultProfile(userId: string) {
    return await prisma.profile.create({
      data: {
        userId,
        status: 'active',
        radiusPref: 25,
      },
      include: {
        hobbies: {
          include: {
            hobby: true,
          },
        },
      },
    });
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: ProfileUpdateInput) {
    const { hobbies, ...profileData } = data;

    // Update the profile
    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData,
        status: profileData.status || 'active',
        radiusPref: profileData.radiusPref || 25,
      },
      include: {
        hobbies: {
          include: {
            hobby: true,
          },
        },
      },
    });

    // Update hobbies if provided
    if (hobbies !== undefined) {
      // Remove existing hobbies
      await prisma.profileHobby.deleteMany({
        where: { profileId: updatedProfile.id },
      });

      // Add new hobbies
      if (hobbies.length > 0) {
        const hobbyRecords = await prisma.hobby.findMany({
          where: { id: { in: hobbies } },
        });

        if (hobbyRecords.length !== hobbies.length) {
          throw new Error('One or more hobby IDs are invalid');
        }

        await prisma.profileHobby.createMany({
          data: hobbies.map((hobbyId) => ({
            profileId: updatedProfile.id,
            hobbyId,
          })),
        });
      }

      // Fetch updated profile with hobbies
      return await prisma.profile.findUnique({
        where: { id: updatedProfile.id },
        include: {
          hobbies: {
            include: {
              hobby: true,
            },
          },
        },
      });
    }

    return updatedProfile;
  }

  /**
   * Update user location
   */
  static async updateLocation(userId: string, data: ProfileLocationInput) {
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        locationLat: data.lat,
        locationLng: data.lng,
      },
      create: {
        userId,
        locationLat: data.lat,
        locationLng: data.lng,
        status: 'active',
        radiusPref: 25,
      },
    });

    return profile;
  }

  /**
   * Get all available hobbies
   */
  static async getAllHobbies() {
    return await prisma.hobby.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get hobbies by category
   */
  static async getHobbiesByCategory(category?: string) {
    if (category) {
      return await prisma.hobby.findMany({
        where: { category },
        orderBy: { name: 'asc' },
      });
    }

    return await this.getAllHobbies();
  }
}