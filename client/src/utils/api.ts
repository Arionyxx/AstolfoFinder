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