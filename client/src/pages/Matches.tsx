import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  matchesApi,
  type MatchDetailResponse,
  type MatchMessageItem,
  type MatchSummary,
} from '../utils/api';

const relativeTimeUnits: Array<{ limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { limit: 60, divisor: 1, unit: 'second' },
  { limit: 3600, divisor: 60, unit: 'minute' },
  { limit: 86400, divisor: 3600, unit: 'hour' },
  { limit: 604800, divisor: 86400, unit: 'day' },
  { limit: 2629800, divisor: 604800, unit: 'week' },
  { limit: 31557600, divisor: 2629800, unit: 'month' },
  { limit: Number.POSITIVE_INFINITY, divisor: 31557600, unit: 'year' },
];

const formatRelativeTime = (iso: string, formatter: Intl.RelativeTimeFormat): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absDiff = Math.abs(diffInSeconds);

  for (const { limit, divisor, unit } of relativeTimeUnits) {
    if (absDiff < limit) {
      const value = Math.round(diffInSeconds / divisor);
      return formatter.format(value, unit);
    }
  }

  return formatter.format(0, 'second');
};

const formatAbsoluteTime = (iso?: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  });
};

const resolveStatusBadge = (match: MatchSummary) => {
  if (!match.lastInteraction) {
    return { label: 'New match', className: 'bg-emerald-100 text-emerald-700' };
  }

  const lastInteraction = new Date(match.lastInteraction);
  const now = new Date();
  const diffHours = Math.abs((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60));

  if (diffHours < 24) {
    return { label: 'Active today', className: 'bg-indigo-100 text-indigo-700' };
  }

  if (diffHours < 24 * 7) {
    return { label: 'This week', className: 'bg-sky-100 text-sky-700' };
  }

  return { label: 'Quiet', className: 'bg-gray-100 text-gray-600' };
};

const getDisplayName = (match: MatchSummary) => match.matchedWithName ?? 'Unnamed connection';

export default function Matches(): JSX.Element {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const [matchDetails, setMatchDetails] = useState<Record<string, MatchDetailResponse['match']>>({});
  const [matchMessages, setMatchMessages] = useState<Record<string, MatchMessageItem[]>>({});
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const relativeTimeFormatter = useMemo(
    () => new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }),
    []
  );

  const loadMatches = useCallback(async () => {
    setLoadingMatches(true);
    setMatchesError(null);

    try {
      const response = await matchesApi.list();
      const fetched = response.matches;

      setMatches(fetched);
      setSelectedMatchId(prev => {
        if (prev && fetched.some(match => match.id === prev)) {
          return prev;
        }
        return fetched[0]?.id ?? null;
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to load matches at the moment.';
      setMatchesError(message);
      setMatches([]);
      setSelectedMatchId(null);
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  const loadConversation = useCallback(
    async (matchId: string) => {
      setConversationLoading(true);
      setConversationError(null);

      try {
        const [detailResponse, messagesResponse] = await Promise.all([
          matchesApi.getDetails(matchId),
          matchesApi.getMessages(matchId),
        ]);

        setMatchDetails(prev => ({
          ...prev,
          [matchId]: detailResponse.match,
        }));

        setMatchMessages(prev => ({
          ...prev,
          [matchId]: messagesResponse.messages,
        }));
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to load conversation right now.';
        setConversationError(message);
      } finally {
        setConversationLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    if (!selectedMatchId) {
      return;
    }

    const alreadyLoaded = matchDetails[selectedMatchId] && matchMessages[selectedMatchId];
    if (alreadyLoaded) {
      return;
    }

    void loadConversation(selectedMatchId);
  }, [loadConversation, matchDetails, matchMessages, selectedMatchId]);

  useEffect(() => {
    setMessageDraft('');
    setConversationError(null);
  }, [selectedMatchId]);

  const selectedMatch = selectedMatchId ? matches.find(match => match.id === selectedMatchId) ?? null : null;
  const selectedConversation = selectedMatchId ? matchMessages[selectedMatchId] ?? [] : [];
  const selectedDetails = selectedMatchId ? matchDetails[selectedMatchId] : undefined;

  const newMatchesCount = useMemo(
    () => matches.filter(match => !match.lastInteraction).length,
    [matches]
  );

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedMatchId) return;

    const trimmed = messageDraft.trim();
    if (!trimmed) {
      setConversationError('Add a message before sending.');
      return;
    }

    setSendingMessage(true);
    setConversationError(null);

    try {
      const response = await matchesApi.sendMessage(selectedMatchId, {
        content: trimmed,
      });

      setMatchMessages(prev => {
        const existing = prev[selectedMatchId] ?? [];
        return {
          ...prev,
          [selectedMatchId]: [...existing, response.message],
        };
      });

      setMatchDetails(prev => {
        const current = prev[selectedMatchId];
        if (!current) return prev;
        return {
          ...prev,
          [selectedMatchId]: {
            ...current,
            lastInteraction: response.message.createdAt,
          },
        };
      });

      setMatches(prev => {
        const updated = prev.map(match =>
          match.id === selectedMatchId
            ? {
                ...match,
                lastInteraction: response.message.createdAt,
              }
            : match
        );

        return updated.sort((a, b) => {
          const dateA = new Date(a.lastInteraction ?? a.createdAt).getTime();
          const dateB = new Date(b.lastInteraction ?? b.createdAt).getTime();
          return dateB - dateA;
        });
      });

      setMessageDraft('');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to send message. Please try again.';
      setConversationError(message);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-12">
      <header className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Connections</p>
            <h1 className="text-3xl font-bold text-gray-900">Connections & Messages</h1>
            <p className="mt-1 text-sm text-gray-500">
              {matches.length ? `${matches.length} matches · ${newMatchesCount} new` : 'No matches just yet.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadMatches()}
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-80">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Matches</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600" aria-label={`${matches.length} total matches`}>
                {matches.length}
              </span>
            </header>

            {loadingMatches ? (
              <div className="flex flex-col items-center justify-center gap-3 px-5 py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
                <p className="text-sm text-gray-500">Loading your matches…</p>
              </div>
            ) : matchesError ? (
              <div className="px-5 py-6 text-sm text-rose-600" role="alert">
                {matchesError}
              </div>
            ) : matches.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-500">
                You don&apos;t have any matches yet. Keep exploring to make new connections!
              </div>
            ) : (
              <ul className="flex max-h-[32rem] flex-col divide-y divide-gray-100 overflow-y-auto" role="list">
                {matches.map(match => {
                  const isSelected = selectedMatchId === match.id;
                  const badge = resolveStatusBadge(match);
                  const relativeLabel = formatRelativeTime(match.lastInteraction ?? match.createdAt, relativeTimeFormatter);

                  return (
                    <li key={match.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectMatch(match.id)}
                        className={`flex w-full flex-col gap-2 px-5 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50'
                        }`}
                        aria-current={isSelected ? 'true' : undefined}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{getDisplayName(match)}</p>
                            <p className="text-xs text-gray-500">Matched {formatRelativeTime(match.createdAt, relativeTimeFormatter)}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {match.lastInteraction ? `Last chat ${relativeLabel}` : 'Start the conversation'}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>

        <section className="flex flex-1 flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {selectedMatch ? (
            selectedDetails ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Chat with {selectedDetails.matchedWith.displayName ?? 'your match'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Matched {formatRelativeTime(selectedMatch.createdAt, relativeTimeFormatter)} · Last activity{' '}
                      {selectedDetails.lastInteraction ? formatRelativeTime(selectedDetails.lastInteraction, relativeTimeFormatter) : 'never'}
                    </p>
                  </div>
                  {selectedDetails.matchedWith.primaryPhoto ? (
                    <img
                      src={selectedDetails.matchedWith.primaryPhoto}
                      alt={`${selectedDetails.matchedWith.displayName ?? 'Match'} profile`}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : null}
                </div>

                <div
                  className="flex h-80 flex-col gap-3 overflow-y-auto rounded-xl bg-gray-50 p-4"
                  aria-live="polite"
                  aria-label="Conversation thread"
                >
                  {conversationLoading ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-gray-500">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
                      Loading conversation…
                    </div>
                  ) : selectedConversation.length ? (
                    selectedConversation.map(message => {
                      const isOwnMessage = message.senderId !== selectedDetails.matchedWith.id;
                      const alignment = isOwnMessage ? 'self-end bg-indigo-600 text-white' : 'self-start bg-white text-gray-900';
                      const bubbleClasses = `max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow ${alignment}`;

                      return (
                        <article key={message.id} className="flex flex-col">
                          <div className={bubbleClasses}>{message.content}</div>
                          <span className={`mt-1 text-[11px] ${isOwnMessage ? 'self-end text-indigo-100' : 'self-start text-gray-400'}`}>
                            {formatAbsoluteTime(message.createdAt)}
                          </span>
                        </article>
                      );
                    })
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-gray-500">
                      <p>Send the first message to break the ice!</p>
                    </div>
                  )}
                </div>

                {conversationError ? (
                  <div
                    id="message-error"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    role="alert"
                  >
                    {conversationError}
                  </div>
                ) : null}

                <form onSubmit={handleSendMessage} className="flex flex-col gap-3" aria-label="Send a message">
                  <label htmlFor="message-input" className="text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    id="message-input"
                    name="message"
                    rows={3}
                    maxLength={1000}
                    value={messageDraft}
                    onChange={event => setMessageDraft(event.target.value)}
                    className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Share something thoughtful…"
                    aria-describedby={conversationError ? 'message-error' : undefined}
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={sendingMessage}
                    >
                      {sendingMessage ? 'Sending…' : 'Send message'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-500">Loading conversation…</div>
            )
          ) : loadingMatches ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">Loading conversation…</div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
              <p>Select a match to start chatting.</p>
              <p>You can revisit previous conversations anytime.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
