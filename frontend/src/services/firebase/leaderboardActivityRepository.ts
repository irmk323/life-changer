import { addDoc, collection, limit, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';
import { db, firebaseConfigError } from './firebaseClient';
import type { LeaderboardActivityEvent } from '../leaderboard/detectLeaderboardActivity';

export interface StoredLeaderboardActivity extends LeaderboardActivityEvent {
  uid: string;
}

const notConfiguredError = () =>
  firebaseConfigError ?? new Error('Firebase is not configured. Set VITE_FIREBASE_* in frontend/.env.local.');

// Pure payload builder kept separate from the Firestore call below, so the "only uid +
// the detected event shape is ever written" guarantee can be unit tested without mocking
// Firestore.
export const buildActivityDocument = (uid: string, event: LeaderboardActivityEvent): StoredLeaderboardActivity => ({
  uid,
  domain: event.domain,
  label: event.label,
  occurredAt: event.occurredAt,
});

export const postLeaderboardActivity = async (uid: string, event: LeaderboardActivityEvent): Promise<void> => {
  if (!db) throw notConfiguredError();
  await addDoc(collection(db, 'leaderboardActivities'), buildActivityDocument(uid, event));
};

// When Firebase isn't configured, report an empty list instead of leaving subscribers
// with no callback at all.
export const subscribeRecentActivities = (limitCount: number, callback: (all: StoredLeaderboardActivity[]) => void): Unsubscribe => {
  if (!db) {
    callback([]);
    return () => {};
  }
  const recentActivitiesQuery = query(collection(db, 'leaderboardActivities'), orderBy('occurredAt', 'desc'), limit(limitCount));
  return onSnapshot(recentActivitiesQuery, (snapshot) => {
    callback(snapshot.docs.map((docSnapshot) => docSnapshot.data() as StoredLeaderboardActivity));
  });
};
