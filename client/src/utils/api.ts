// API utility functions
const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }

      throw new ApiError(
        errorData.error || errorData.message || 'Request failed',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error occurred', 0);
  }
};

export interface DiscoverySharedHobby {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

export interface DiscoveryPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
}

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
  sharedHobbies: DiscoverySharedHobby[];
  photos: DiscoveryPhoto[];
}

export interface DiscoveryPagination {
  hasMore: boolean;
  total: number;
  limit: number;
  offset: number;
}

export interface DiscoveryProfilesResponse {
  profiles: DiscoveryProfile[];
  pagination: DiscoveryPagination;
}

export interface DiscoveryQueryParams {
  limit?: number;
  offset?: number;
  radius?: number;
  genderPreference?: string;
  minAge?: number;
  maxAge?: number;
  sameCity?: boolean;
}

const buildDiscoveryQuery = (params: DiscoveryQueryParams): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

export const discoveryApi = {
  getProfiles: (params: DiscoveryQueryParams = {}): Promise<DiscoveryProfilesResponse> =>
    apiRequest(`/discovery/profiles${buildDiscoveryQuery(params)}`),
  getPreferences: () => apiRequest('/discovery/preferences'),
};

export interface SwipeStats {
  totalSwipesToday: number;
  swipesRemaining: number;
  resetTime: string;
}

export interface SwipeStatusResponse {
  stats: SwipeStats;
}

export interface SwipeResult {
  success: boolean;
  swipeId: string;
  matchCreated?: boolean;
  message: string;
}

export interface SwipeResponse {
  swipe: SwipeResult;
}

export const swipeApi = {
  getStatus: (): Promise<SwipeStatusResponse> => apiRequest('/swipes/status'),
  recordSwipe: (targetId: string, direction: 'like' | 'pass'): Promise<SwipeResponse> =>
    apiRequest('/swipes', {
      method: 'POST',
      body: JSON.stringify({ targetId, direction }),
    }),
};

// Profile API functions
export const profileApi = {
  getProfile: () => apiRequest('/profile'),

  updateProfile: (data: any) =>
    apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateLocation: (lat: number, lng: number, manualEntry = false) =>
    apiRequest('/profile/location', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, manualEntry }),
    }),
};

// Hobbies API functions
export const hobbiesApi = {
  getHobbies: (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiRequest(`/hobbies${query}`);
  },
};

// Health check API
export const healthApi = {
  check: () => apiRequest('/health'),
};

export { ApiError };