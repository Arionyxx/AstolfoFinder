import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfileEditor from '../components/ProfileEditor';
import * as api from '../utils/api';

// Mock the API functions
vi.mock('../utils/api', () => ({
  profileApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
  hobbiesApi: {
    getHobbies: vi.fn(),
  },
  ApiError: class extends Error {
    constructor(message: string, public status: number) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock React Router
const MockRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ProfileEditor', () => {
  const mockHobbies = [
    { id: '1', name: 'Reading', category: 'Indoor' },
    { id: '2', name: 'Hiking', category: 'Outdoor' },
    { id: '3', name: 'Cooking', category: 'Indoor' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful hobbies fetch
    (api.hobbiesApi.getHobbies as any).mockResolvedValue({
      hobbies: mockHobbies,
    });

    // Mock profile not found (new profile)
    (api.profileApi.getProfile as any).mockRejectedValue(
      new (api as any).ApiError('Profile not found', 404)
    );
  });

  const renderProfileEditor = () => {
    return render(
      <MockRouter>
        <ProfileEditor />
      </MockRouter>
    );
  };

  it('should render the first step with basic information fields', async () => {
    renderProfileEditor();

    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByLabelText('Display Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Pronouns *')).toBeInTheDocument();
      expect(screen.getByLabelText('Gender Identity *')).toBeInTheDocument();
      expect(screen.getByLabelText('Age *')).toBeInTheDocument();
      expect(screen.getByText('Profile Photo')).toBeInTheDocument();
    });
  });

  it('should show progress indicator', async () => {
    renderProfileEditor();

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('should validate required fields on first step', async () => {
    renderProfileEditor();

    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    // Try to proceed without filling required fields
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
    });
  });

  it('should proceed to next step when first step is valid', async () => {
    renderProfileEditor();

    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Pronouns *'), {
      target: { value: 'he/him' },
    });
    fireEvent.change(screen.getByLabelText('Gender Identity *'), {
      target: { value: 'male' },
    });
    fireEvent.change(screen.getByLabelText('Age *'), {
      target: { value: '25' },
    });

    // Click next
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('About You')).toBeInTheDocument();
      expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
    });
  });

  it('should handle hobbies selection', async () => {
    renderProfileEditor();

    // Navigate to hobbies step
    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    // Fill and proceed through steps
    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Pronouns *'), {
      target: { value: 'he/him' },
    });
    fireEvent.change(screen.getByLabelText('Gender Identity *'), {
      target: { value: 'male' },
    });
    fireEvent.change(screen.getByLabelText('Age *'), {
      target: { value: '25' },
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('About You')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Hobbies & Interests')).toBeInTheDocument();
      expect(screen.getByText('Reading')).toBeInTheDocument();
      expect(screen.getByText('Hiking')).toBeInTheDocument();
      expect(screen.getByText('Cooking')).toBeInTheDocument();
    });

    // Select hobbies
    const readingCheckbox = screen.getByLabelText('Reading');
    const hikingCheckbox = screen.getByLabelText('Hiking');

    fireEvent.click(readingCheckbox);
    fireEvent.click(hikingCheckbox);

    expect(readingCheckbox).toBeChecked();
    expect(hikingCheckbox).toBeChecked();
  });

  it('should handle location with geolocation', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition as any);
    });

    renderProfileEditor();

    // Navigate to location step
    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    // Fill and proceed through steps
    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Pronouns *'), {
      target: { value: 'he/him' },
    });
    fireEvent.change(screen.getByLabelText('Gender Identity *'), {
      target: { value: 'male' },
    });
    fireEvent.change(screen.getByLabelText('Age *'), {
      target: { value: '25' },
    });

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('About You')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Hobbies & Interests')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    // Use current location
    const locationButton = screen.getByText('Use my current location');
    fireEvent.click(locationButton);

    await waitFor(() => {
      expect(screen.getByText(/✓ Location set:/)).toBeInTheDocument();
    });
  });

  it('should handle manual location entry', async () => {
    renderProfileEditor();

    // Navigate to location step
    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    // Fill and proceed through steps quickly
    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Pronouns *'), {
      target: { value: 'he/him' },
    });
    fireEvent.change(screen.getByLabelText('Gender Identity *'), {
      target: { value: 'male' },
    });
    fireEvent.change(screen.getByLabelText('Age *'), {
      target: { value: '25' },
    });

    // Click next 3 times to reach location step
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('About You')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Hobbies & Interests')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    // Switch to manual entry
    const manualButton = screen.getByText('Enter location manually');
    fireEvent.click(manualButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Latitude')).toBeInTheDocument();
      expect(screen.getByLabelText('Longitude')).toBeInTheDocument();
    });

    // Enter coordinates
    fireEvent.change(screen.getByLabelText('Latitude'), {
      target: { value: '40.7128' },
    });
    fireEvent.change(screen.getByLabelText('Longitude'), {
      target: { value: '-74.0060' },
    });

    await waitFor(() => {
      expect(screen.getByText(/✓ Location set:/)).toBeInTheDocument();
    });
  });

  it('should handle radius slider', async () => {
    renderProfileEditor();

    // Navigate to radius step (step 5)
    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    // Fill first step and proceed through quickly
    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Pronouns *'), {
      target: { value: 'he/him' },
    });
    fireEvent.change(screen.getByLabelText('Gender Identity *'), {
      target: { value: 'male' },
    });
    fireEvent.change(screen.getByLabelText('Age *'), {
      target: { value: '25' },
    });

    // Navigate through steps to radius
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('Next'));
    }

    await waitFor(() => {
      expect(screen.getByText('Search Radius')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    });

    // Change radius
    const radiusSlider = screen.getByDisplayValue('25');
    fireEvent.change(radiusSlider, { target: { value: '50' } });

    await waitFor(() => {
      expect(screen.getByText('Maximum distance for matches: 50 miles')).toBeInTheDocument();
    });
  });

  it('should submit profile successfully', async () => {
    (api.profileApi.updateProfile as any).mockResolvedValue({
      message: 'Profile updated successfully',
    });

    renderProfileEditor();

    // Fill first step
    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Pronouns *'), {
      target: { value: 'he/him' },
    });
    fireEvent.change(screen.getByLabelText('Gender Identity *'), {
      target: { value: 'male' },
    });
    fireEvent.change(screen.getByLabelText('Age *'), {
      target: { value: '25' },
    });

    // Navigate through all steps to review
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next'));
    }

    await waitFor(() => {
      expect(screen.getByText('Review Your Profile')).toBeInTheDocument();
    });

    // Submit profile
    const submitButton = screen.getByText('Complete Profile');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.profileApi.updateProfile).toHaveBeenCalledWith({
        displayName: 'John Doe',
        pronouns: 'he/him',
        gender: 'male',
        age: 25,
        bio: '',
        status: 'active',
        hobbies: [],
        locationLat: null,
        locationLng: null,
        radiusPref: 25,
      });
    });
  });

  it('should handle API errors gracefully', async () => {
    (api.profileApi.updateProfile as any).mockRejectedValue(
      new Error('Failed to save profile')
    );

    renderProfileEditor();

    // Fill first step
    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Display Name *'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Pronouns *'), {
      target: { value: 'he/him' },
    });
    fireEvent.change(screen.getByLabelText('Gender Identity *'), {
      target: { value: 'male' },
    });
    fireEvent.change(screen.getByLabelText('Age *'), {
      target: { value: '25' },
    });

    // Navigate through all steps to review
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next'));
    }

    await waitFor(() => {
      expect(screen.getByText('Review Your Profile')).toBeInTheDocument();
    });

    // Submit profile and expect error
    const submitButton = screen.getByText('Complete Profile');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save profile')).toBeInTheDocument();
    });
  });
});