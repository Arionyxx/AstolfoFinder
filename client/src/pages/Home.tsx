import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DiscoveryCard from '../components/DiscoveryCard';
import {
  ApiError,
  discoveryApi,
  swipeApi,
  type DiscoveryProfile,
  type DiscoveryProfilesResponse,
  type SwipeStats,
  type SwipeStatusResponse,
} from '../utils/api';

const DAILY_SWIPE_LIMIT = 100;

type SwipeDirection = 'like' | 'pass';

type FeedbackTone = 'info' | 'success' | 'warning' | 'error';

interface FeedbackState {
  type: FeedbackTone;
  text: string;
}

const feedbackToneStyles: Record<FeedbackTone, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
};

const formatResetTime = (resetTime?: string | null): string | null => {
  if (!resetTime) return null;
  const date = new Date(resetTime);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const createSwipeLogger = (direction: SwipeDirection, name?: string | null): FeedbackState => {
  if (direction === 'like') {
    return {
      type: 'success',
      text: name ? `You liked ${name}` : 'Swipe recorded',
    };
  }

  return {
    type: 'info',
    text: name ? `You passed on ${name}` : 'Swipe recorded',
  };
};

export default function Home(): JSX.Element {
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [stats, setStats] = useState<SwipeStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [matchToast, setMatchToast] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);

  const fetchedCountRef = useRef(0);
  const currentProfileRef = useRef<DiscoveryProfile | null>(null);

  useEffect(() => {
    currentProfileRef.current = profiles[0] ?? null;
  }, [profiles]);

  useEffect(() => {
    if (!matchToast) return;

    const timer = window.setTimeout(() => {
      setMatchToast(null);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [matchToast]);

  const applyStats = useCallback((statusResponse: SwipeStatusResponse): void => {
    setStats(statusResponse.stats);
    const reached = statusResponse.stats.swipesRemaining <= 0;
    setLimitReached(reached);
    if (reached) {
      setFeedback({
        type: 'warning',
        text: 'Daily swipe limit reached. Check back after the reset.',
      });
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    setFeedback(null);
    setLimitReached(false);
    setStats(null);
    setProfiles([]);
    setHasMore(true);
    fetchedCountRef.current = 0;

    try {
      const [statusResponse, discoveryResponse] = await Promise.all<[
        SwipeStatusResponse,
        DiscoveryProfilesResponse
      ]>([
        swipeApi.getStatus(),
        discoveryApi.getProfiles({ limit: 10, offset: 0 }),
      ]);

      applyStats(statusResponse);

      fetchedCountRef.current =
        discoveryResponse.pagination.offset + discoveryResponse.profiles.length;
      setHasMore(discoveryResponse.pagination.hasMore);
      setProfiles(discoveryResponse.profiles);

      if (statusResponse.stats.swipesRemaining > 0) {
        if (!discoveryResponse.profiles.length) {
          setFeedback({
            type: 'info',
            text: 'No more profiles nearby right now. Check back later!',
          });
        } else {
          setFeedback(null);
        }
      }
    } catch (err) {
      setProfiles([]);
      setLimitReached(false);
      setHasMore(true);
      setStats(null);
      const message = err instanceof ApiError ? err.message : 'Unable to load discovery feed. Please try again.';
      setError(message);
    } finally {
      setInitialLoading(false);
    }
  }, [applyStats]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const response = await discoveryApi.getProfiles({
        limit: 10,
        offset: fetchedCountRef.current,
      });

      fetchedCountRef.current = response.pagination.offset + response.profiles.length;
      setHasMore(response.pagination.hasMore);

      if (response.profiles.length) {
        setProfiles(prev => [...prev, ...response.profiles]);
      }
    } catch (err) {
      setFeedback(prev => {
        if (prev && prev.type === 'warning') {
          return prev;
        }
        const message = err instanceof ApiError ? err.message : 'Unable to load more profiles right now.';
        return {
          type: 'error',
          text: message,
        };
      });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore]);

  useEffect(() => {
    if (initialLoading || loadingMore || !hasMore || limitReached) {
      return;
    }

    if (profiles.length < 3) {
      void loadMore();
    }
  }, [profiles.length, hasMore, loadingMore, initialLoading, limitReached, loadMore]);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      if (limitReached || isProcessingSwipe) return;

      const currentProfile = currentProfileRef.current;
      if (!currentProfile) return;

      setIsProcessingSwipe(true);
      setFeedback(null);
      setProfiles(prev => prev.slice(1));

      try {
        const response = await swipeApi.recordSwipe(currentProfile.userId, direction);

        if (response.swipe.matchCreated) {
          const toastMessage = response.swipe.message || "It's a match!";
          setFeedback({
            type: 'success',
            text: toastMessage,
          });
          setMatchToast(toastMessage);
        } else if (response.swipe.message) {
          setFeedback({
            type: direction === 'like' ? 'success' : 'info',
            text: response.swipe.message,
          });
        } else {
          setFeedback(createSwipeLogger(direction, currentProfile.displayName));
        }

        const statusResponse = await swipeApi.getStatus();
        applyStats(statusResponse);
      } catch (err) {
        setProfiles(prev => [currentProfile, ...prev]);

        if (err instanceof ApiError) {
          if (err.status === 429) {
            setLimitReached(true);
            setFeedback({
              type: 'warning',
              text: err.message || 'Daily swipe limit reached. Check back after the reset.',
            });
          } else {
            setFeedback({
              type: 'error',
              text: err.message || 'Unable to record swipe. Please try again.',
            });
          }
        } else {
          setFeedback({
            type: 'error',
            text: 'Unable to record swipe. Please try again.',
          });
        }
      } finally {
        setIsProcessingSwipe(false);
      }
    },
    [applyStats, isProcessingSwipe, limitReached]
  );

  const swipesRemaining = stats?.swipesRemaining ?? DAILY_SWIPE_LIMIT;
  const swipesUsed = stats?.totalSwipesToday ?? 0;
  const resetTimeLabel = useMemo(() => formatResetTime(stats?.resetTime), [stats?.resetTime]);
  const remainingPercent = stats ? Math.max(0, Math.min(100, (swipesRemaining / DAILY_SWIPE_LIMIT) * 100)) : 100;
  const activeProfiles = profiles.slice(0, 3);
  const hasActiveProfile = activeProfiles.length > 0;
  const canSwipe = hasActiveProfile && !limitReached && !isProcessingSwipe;

  const handleRefresh = useCallback(() => {
    void loadInitial();
  }, [loadInitial]);

  const dismissMatchToast = useCallback(() => {
    setMatchToast(null);
  }, []);

  const handlePass = useCallback(() => {
    void handleSwipe('pass');
  }, [handleSwipe]);

  const handleLike = useCallback(() => {
    void handleSwipe('like');
  }, [handleSwipe]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-12">
      {matchToast ? (
        <div className="fixed inset-x-0 top-4 z-20 flex justify-center px-4 sm:justify-end sm:px-6">
          <div
            className="relative w-full max-w-sm rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-lg"
            role="status"
            aria-live="polite"
          >
            <p className="pr-8 text-sm font-semibold text-emerald-700">{matchToast}</p>
            <button
              type="button"
              onClick={dismissMatchToast}
              className="absolute right-2 top-2 rounded-full p-1 text-emerald-600 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              aria-label="Dismiss match notification"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
      <header className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Swipes remaining
            </p>
            <p className={`text-3xl font-bold ${limitReached ? 'text-rose-600' : 'text-gray-900'}`}>
              {stats ? `${swipesRemaining} / ${DAILY_SWIPE_LIMIT}` : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Used today
            </p>
            <p className="text-xl font-semibold text-gray-900">{stats ? swipesUsed : '—'}</p>
            {resetTimeLabel ? (
              <p className="text-xs text-gray-500">Resets at {resetTimeLabel}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-gray-100">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${limitReached ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${remainingPercent}%` }}
          />
        </div>
      </header>

      {feedback && !error ? (
        <div className={`rounded-2xl border px-5 py-4 text-sm font-medium shadow-sm ${feedbackToneStyles[feedback.type]}`}>
          {feedback.text}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-rose-700">Unable to load discovery feed</h2>
          <p className="mt-2 text-sm text-rose-600">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <section className="relative flex min-h-[28rem] w-full justify-center">
            <div className="relative w-full max-w-md">
              {initialLoading ? (
                <div className="flex h-[28rem] flex-col items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
                  <p className="mt-4 text-sm text-gray-600">Loading discovery feed...</p>
                </div>
              ) : hasActiveProfile ? (
                <>
                  {activeProfiles.map((profile, index) => (
                    <DiscoveryCard
                      key={profile.id}
                      profile={profile}
                      depth={index}
                      isActive={index === 0}
                      onSwipe={index === 0 ? handleSwipe : undefined}
                      disabled={index !== 0 || !canSwipe}
                    />
                  ))}
                  {limitReached ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white/85 p-8 text-center backdrop-blur-sm">
                      <h3 className="text-lg font-semibold text-gray-900">Daily swipe limit reached</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Swiping is paused until the daily reset. Check back soon!
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex h-[28rem] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">No profiles nearby right now</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    We&apos;ll notify you when new profiles are available. Try refreshing in a bit.
                  </p>
                  <button
                    type="button"
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleRefresh}
                  >
                    Refresh feed
                  </button>
                </div>
              )}
            </div>
          </section>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handlePass}
              disabled={!canSwipe}
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white text-lg font-semibold text-gray-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                canSwipe ? 'hover:border-gray-400 hover:text-gray-900' : 'cursor-not-allowed opacity-50'
              }`}
              aria-label="Pass"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={handleLike}
              disabled={!canSwipe}
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-xl font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                canSwipe ? 'hover:bg-indigo-500' : 'cursor-not-allowed opacity-60'
              }`}
              aria-label="Like"
            >
              ↑
            </button>
          </div>

          {loadingMore ? (
            <p className="text-center text-sm text-gray-500">Loading more profiles...</p>
          ) : null}

          {isProcessingSwipe ? (
            <p className="text-center text-xs text-gray-400">Recording your swipe...</p>
          ) : null}
        </>
      )}
    </div>
  );
}
