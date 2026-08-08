import { useEffect, useRef } from 'react';
import type { AppState } from '../types/appState';
import { calculateLeaderboardProgress, type LeaderboardProgress } from '../services/leaderboard/leaderboardProgress';
import { detectLeaderboardActivity } from '../services/leaderboard/detectLeaderboardActivity';
import { syncLeaderboardProgress } from '../services/firebase/leaderboardProgressRepository';
import { postLeaderboardActivity } from '../services/firebase/leaderboardActivityRepository';
import { useAppState } from './AppStateProvider';
import { useAuth } from './AuthProvider';

export const SYNC_DEBOUNCE_MS = 3000;

// Pure so the "skip Firestore writes when the value hasn't actually changed" behaviour is
// unit-testable without mounting React or mocking timers/Firestore.
export const shouldSync = (previousSerialized: string | null, next: LeaderboardProgress): { shouldSync: boolean; serialized: string } => {
  const serialized = JSON.stringify(next);
  return { shouldSync: serialized !== previousSerialized, serialized };
};

// Renders nothing — just watches AppState and, while signed in: (1) debounces
// calculateLeaderboardProgress() writes to Firestore, and (2) detects newly-completed
// items and posts them as leaderboardActivities. Mounted once in App.tsx so it runs
// regardless of which route is active.
export function LeaderboardSyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { state } = useAppState();
  const lastSyncedRef = useRef<string | null>(null);
  const previousStateRef = useRef<AppState | null>(null);

  useEffect(() => {
    if (!user) {
      lastSyncedRef.current = null;
      previousStateRef.current = null;
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const { shouldSync: dirty, serialized } = shouldSync(lastSyncedRef.current, calculateLeaderboardProgress(state));
    if (dirty) {
      timeout = setTimeout(() => {
        lastSyncedRef.current = serialized;
        syncLeaderboardProgress(user.uid, JSON.parse(serialized)).catch((err) => {
          console.warn('Failed to sync leaderboard progress:', err);
        });
      }, SYNC_DEBOUNCE_MS);
    }

    // Not debounced: each event is already deduplicated by detectLeaderboardActivity only
    // firing on a genuine NOT_STARTED->DONE-style transition since the last render.
    const events = detectLeaderboardActivity(previousStateRef.current, state, new Date().toISOString());
    previousStateRef.current = state;
    events.forEach((event) => {
      postLeaderboardActivity(user.uid, event).catch((err) => {
        console.warn('Failed to post leaderboard activity:', err);
      });
    });

    return () => { if (timeout) clearTimeout(timeout); };
  }, [user, state]);

  return <>{children}</>;
}
