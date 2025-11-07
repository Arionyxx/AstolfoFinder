import { useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { DiscoveryProfile } from '../utils/api';

interface DiscoveryCardProps {
  profile: DiscoveryProfile;
  depth: number;
  isActive: boolean;
  onSwipe?: (direction: 'like' | 'pass') => void;
  disabled?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const DEPTH_OFFSET = 18;
const DEPTH_SCALE_STEP = 0.05;
const SWIPE_THRESHOLD = 90;

const feedbackColors: Record<'like' | 'pass', string> = {
  like: 'bg-emerald-500/90',
  pass: 'bg-rose-500/90',
};

export default function DiscoveryCard({
  profile,
  depth,
  isActive,
  onSwipe,
  disabled = false,
}: DiscoveryCardProps): JSX.Element {
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [transition, setTransition] = useState<string>('transform 0.25s ease');
  const [dragging, setDragging] = useState(false);

  const startPointRef = useRef<Point>({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });

  const interactive = isActive && !disabled && typeof onSwipe === 'function';

  const updateOffset = (next: Point): void => {
    offsetRef.current = next;
    setOffset(next);
  };

  const resetPosition = (): void => {
    setTransition('transform 0.25s ease');
    updateOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (!interactive) return;

    pointerIdRef.current = event.pointerId;
    startPointRef.current = { x: event.clientX, y: event.clientY };
    setTransition('');
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!dragging) return;

    const deltaX = event.clientX - startPointRef.current.x;
    const deltaY = event.clientY - startPointRef.current.y;
    updateOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>): void => {
    if (!dragging) return;

    if (pointerIdRef.current !== null) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
      pointerIdRef.current = null;
    }

    setDragging(false);

    const currentOffset = offsetRef.current;

    if (interactive && currentOffset.y <= -SWIPE_THRESHOLD) {
      onSwipe?.('like');
      return;
    }

    if (interactive && currentOffset.y >= SWIPE_THRESHOLD) {
      onSwipe?.('pass');
      return;
    }

    resetPosition();
  };

  const handlePointerCancel = (): void => {
    if (!dragging) return;
    setDragging(false);
    resetPosition();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!interactive) return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onSwipe?.('like');
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onSwipe?.('pass');
    }
  };

  const primaryPhoto = useMemo(() => {
    if (!profile.photos.length) {
      return null;
    }

    return profile.photos.find(photo => photo.isPrimary) ?? profile.photos[0];
  }, [profile.photos]);

  const initials = useMemo(() => {
    const name = profile.displayName?.trim();
    if (!name) return '??';

    const parts = name.split(' ').filter(Boolean);
    if (!parts.length) return name.slice(0, 2).toUpperCase();

    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[1]?.[0] ?? '' : parts[0]?.[1] ?? '';
    return `${first}${second}`.toUpperCase();
  }, [profile.displayName]);

  const translateX = isActive ? offset.x : 0;
  const translateY = isActive ? offset.y : depth * DEPTH_OFFSET;
  const scale = isActive ? 1 : Math.max(0.9, 1 - depth * DEPTH_SCALE_STEP);
  const rotation = isActive ? offset.x / 20 : 0;
  const pointerEvents = interactive ? 'auto' : 'none';
  const touchAction = interactive ? 'none' : 'auto';

  const distanceLabel = profile.distance !== null ? `${profile.distance.toFixed(1)} mi away` : null;
  const showLikeIndicator = interactive && offset.y < -60;
  const showPassIndicator = interactive && offset.y > 60;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        zIndex: 20 - depth,
        transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`,
        transition,
        pointerEvents,
        touchAction,
      }}
      aria-disabled={!interactive}
      data-testid={isActive ? 'discovery-card-active' : undefined}
      tabIndex={interactive ? 0 : -1}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
    >
      <article className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="relative h-96 w-full bg-gray-100">
          {primaryPhoto ? (
            <img
              src={primaryPhoto.url}
              alt={profile.displayName ?? 'Profile photo'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
              <span className="text-5xl font-bold text-indigo-500">{initials}</span>
            </div>
          )}
          {showLikeIndicator && (
            <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow ${feedbackColors.like}`}>
              Like
            </div>
          )}
          {showPassIndicator && (
            <div className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow ${feedbackColors.pass}`}>
              Pass
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 p-6">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.displayName ?? 'Someone Nearby'}
                {profile.age ? <span className="ml-2 text-lg font-semibold text-gray-600">{profile.age}</span> : null}
              </h2>
              {profile.pronouns ? (
                <p className="text-sm text-gray-500">{profile.pronouns}</p>
              ) : null}
              {profile.status ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-emerald-600">
                  {profile.status}
                </p>
              ) : null}
            </div>
            {distanceLabel ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                {distanceLabel}
              </span>
            ) : null}
          </header>

          {profile.bio ? <p className="text-sm leading-relaxed text-gray-600">{profile.bio}</p> : null}

          {profile.sharedHobbies.length ? (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Shared hobbies ({profile.sharedHobbies.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.sharedHobbies.slice(0, 6).map(hobby => (
                  <span
                    key={hobby.id}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {hobby.name}
                  </span>
                ))}
                {profile.sharedHobbies.length > 6 ? (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                    +{profile.sharedHobbies.length - 6} more
                  </span>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </article>
    </div>
  );
}
