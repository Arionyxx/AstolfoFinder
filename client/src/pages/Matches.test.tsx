import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Matches from './Matches';

describe('Matches page', () => {
  const now = new Date('2024-02-01T12:00:00.000Z');
  const earlier = new Date('2024-01-31T18:30:00.000Z');

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createFetchMock = () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      if (url === '/api/matches' && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            matches: [
              {
                id: 'match-1',
                matchedWithId: 'user-1',
                matchedWithName: 'Taylor',
                createdAt: earlier.toISOString(),
                lastInteraction: null,
              },
              {
                id: 'match-2',
                matchedWithId: 'user-2',
                matchedWithName: 'Harper',
                createdAt: now.toISOString(),
                lastInteraction: now.toISOString(),
              },
            ],
            total: 2,
          }),
        });
      }

      if (url === '/api/matches/match-1' && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            match: {
              id: 'match-1',
              matchedWith: {
                id: 'user-1',
                displayName: 'Taylor',
                age: 29,
                gender: 'female',
                bio: 'Enjoys hiking and painting.',
                primaryPhoto: null,
              },
              createdAt: earlier.toISOString(),
              lastInteraction: null,
            },
          }),
        });
      }

      if (url === '/api/matches/match-1/messages' && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            messages: [],
          }),
        });
      }

      if (url === '/api/matches/match-1/messages' && method === 'POST') {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: {
              id: 'message-1',
              matchId: 'match-1',
              senderId: 'current-user',
              content: body.content,
              createdAt: now.toISOString(),
            },
          }),
        });
      }

      throw new Error(`Unhandled fetch call: ${url} (${method})`);
    });

    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
  };

  it('renders matches and loads the first conversation', async () => {
    const fetchMock = createFetchMock();

    render(<Matches />);

    expect(await screen.findByRole('heading', { name: /Connections & Messages/i })).toBeInTheDocument();
    expect(await screen.findByText('Taylor')).toBeInTheDocument();
    expect(await screen.findByText('Harper')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/matches/match-1',
        expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/matches/match-1/messages',
        expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
      );
    });

    expect(await screen.findByText(/Chat with Taylor/i)).toBeInTheDocument();
    expect(screen.getByText(/Send the first message/i)).toBeInTheDocument();
    expect(screen.getByText('New match')).toBeInTheDocument();
  });

  it('allows sending a new message to the current match', async () => {
    const fetchMock = createFetchMock();

    render(<Matches />);

    await screen.findByText('Taylor');

    const messageField = await screen.findByLabelText('Message');
    fireEvent.change(messageField, { target: { value: 'Hello there!' } });

    const sendButton = screen.getByRole('button', { name: /Send message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/matches/match-1/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Hello there!' }),
        })
      );
    });

    expect(await screen.findByText('Hello there!')).toBeInTheDocument();
  });
});
