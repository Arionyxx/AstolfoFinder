import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Home from './Home';

describe('Discovery Home feed', () => {
  const resetTime = '2024-01-01T05:00:00.000Z';

  const mockProfile = {
    id: 'profile-1',
    userId: 'user-1',
    displayName: 'Alex',
    age: 29,
    gender: 'non-binary',
    pronouns: 'they/them',
    bio: 'Explorer, foodie, and avid reader.',
    status: 'Active',
    locationLat: 40.7128,
    locationLng: -74.006,
    distance: 3.2,
    sharedHobbies: [
      { id: 'hobby-1', name: 'Hiking', description: null, category: 'Outdoor' },
      { id: 'hobby-2', name: 'Cooking', description: null, category: 'Indoor' },
    ],
    photos: [],
  };

  const mockProfilesResponse = {
    profiles: [mockProfile],
    pagination: { hasMore: false, total: 1, limit: 10, offset: 0 },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows swiping up to like and updates the swipe counter', async () => {
    let statusCall = 0;
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url === '/api/swipes/status') {
        statusCall += 1;
        const stats =
          statusCall === 1
            ? { totalSwipesToday: 10, swipesRemaining: 90, resetTime }
            : { totalSwipesToday: 11, swipesRemaining: 89, resetTime };
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats }),
        });
      }

      if (url.startsWith('/api/discovery/profiles')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProfilesResponse,
        });
      }

      if (url === '/api/swipes' && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            swipe: {
              success: true,
              swipeId: 'swipe-1',
              matchCreated: false,
              message: 'Swiped like',
            },
          }),
        });
      }

      throw new Error(`Unhandled fetch call: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    render(<Home />);

    await screen.findByText('90 / 100');
    const activeCard = await screen.findByTestId('discovery-card-active');

    fireEvent.pointerDown(activeCard, { clientX: 160, clientY: 240 });
    fireEvent.pointerMove(activeCard, { clientX: 160, clientY: 120 });
    fireEvent.pointerUp(activeCard, { clientX: 160, clientY: 120 });

    await waitFor(() => {
      const swipeCall = fetchMock.mock.calls.find(([url]) => url === '/api/swipes');
      expect(swipeCall).toBeTruthy();
    });

    const swipeCall = fetchMock.mock.calls.find(([url]) => url === '/api/swipes');
    const swipeOptions = swipeCall?.[1] as RequestInit;
    const swipePayload = swipeOptions?.body ? JSON.parse(swipeOptions.body as string) : null;
    expect(swipePayload).toEqual({ targetId: 'user-1', direction: 'like' });

    await waitFor(() => {
      expect(screen.getByText('89 / 100')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('discovery-card-active')).not.toBeInTheDocument();
    expect(await screen.findByText('Swiped like')).toBeInTheDocument();
  });

  it('shows limit reached state and prevents swiping when swipes are exhausted', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url === '/api/swipes/status') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            stats: { totalSwipesToday: 100, swipesRemaining: 0, resetTime },
          }),
        });
      }

      if (url.startsWith('/api/discovery/profiles')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProfilesResponse,
        });
      }

      if (url === '/api/swipes') {
        throw new Error('Swipe API should not be called when limit is reached');
      }

      throw new Error(`Unhandled fetch call: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    render(<Home />);

    await screen.findByText('0 / 100');
    expect(await screen.findByText(/Daily swipe limit reached/i)).toBeInTheDocument();

    const likeButton = screen.getByRole('button', { name: 'Like' });
    const passButton = screen.getByRole('button', { name: 'Pass' });
    expect(likeButton).toBeDisabled();
    expect(passButton).toBeDisabled();

    const activeCard = screen.getByTestId('discovery-card-active');
    fireEvent.pointerDown(activeCard, { clientX: 150, clientY: 220 });
    fireEvent.pointerMove(activeCard, { clientX: 150, clientY: 80 });
    fireEvent.pointerUp(activeCard, { clientX: 150, clientY: 80 });

    await new Promise(resolve => setTimeout(resolve, 0));

    const swipeCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/swipes');
    expect(swipeCalls).toHaveLength(0);
    expect(screen.getByTestId('discovery-card-active')).toBeInTheDocument();
  });
});
