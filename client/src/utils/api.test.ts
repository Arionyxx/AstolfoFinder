import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileApi, hobbiesApi, ApiError } from '../api';

// Mock fetch
global.fetch = vi.fn();

describe('API Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('profileApi', () => {
    describe('getProfile', () => {
      it('should fetch profile successfully', async () => {
        const mockProfile = {
          profile: {
            id: '1',
            displayName: 'John Doe',
            age: 25,
            gender: 'male',
            pronouns: 'he/him',
            bio: 'Test bio',
            status: 'active',
            locationLat: 40.7128,
            locationLng: -74.0060,
            radiusPref: 25,
            hobbies: [],
          },
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfile,
        });

        const result = await profileApi.getProfile();

        expect(fetch).toHaveBeenCalledWith('/api/profile', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        expect(result).toEqual(mockProfile);
      });

      it('should throw ApiError on failed request', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: 'Profile not found' }),
        });

        await expect(profileApi.getProfile()).rejects.toThrow(ApiError);
      });
    });

    describe('updateProfile', () => {
      it('should update profile successfully', async () => {
        const updateData = {
          displayName: 'Jane Doe',
          age: 30,
          gender: 'female' as const,
        };

        const mockResponse = {
          message: 'Profile updated successfully',
          profile: { id: '1', ...updateData },
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await profileApi.updateProfile(updateData);

        expect(fetch).toHaveBeenCalledWith('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        expect(result).toEqual(mockResponse);
      });

      it('should throw ApiError on failed update', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid input' }),
        });

        await expect(profileApi.updateProfile({})).rejects.toThrow(ApiError);
      });
    });

    describe('updateLocation', () => {
      it('should update location successfully', async () => {
        const mockResponse = {
          message: 'Location updated successfully',
          location: { lat: 40.7128, lng: -74.0060 },
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await profileApi.updateLocation(40.7128, -74.0060);

        expect(fetch).toHaveBeenCalledWith('/api/profile/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lat: 40.7128, lng: -74.0060, manualEntry: false }),
        });
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('hobbiesApi', () => {
    describe('getHobbies', () => {
      it('should fetch all hobbies successfully', async () => {
        const mockHobbies = {
          hobbies: [
            { id: '1', name: 'Reading', category: 'Indoor' },
            { id: '2', name: 'Hiking', category: 'Outdoor' },
          ],
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockHobbies,
        });

        const result = await hobbiesApi.getHobbies();

        expect(fetch).toHaveBeenCalledWith('/api/hobbies', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        expect(result).toEqual(mockHobbies);
      });

      it('should fetch hobbies by category successfully', async () => {
        const mockHobbies = {
          hobbies: [{ id: '1', name: 'Reading', category: 'Indoor' }],
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockHobbies,
        });

        const result = await hobbiesApi.getHobbies('Indoor');

        expect(fetch).toHaveBeenCalledWith('/api/hobbies?category=Indoor', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        expect(result).toEqual(mockHobbies);
      });
    });
  });

  describe('ApiError', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError('Test error', 400, { field: 'value' });

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.data).toEqual({ field: 'value' });
      expect(error.name).toBe('ApiError');
    });
  });

  describe('network error handling', () => {
    it('should throw ApiError on network failure', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(profileApi.getProfile()).rejects.toThrow(ApiError);
    });
  });
});