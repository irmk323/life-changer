import { collection, doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db, firebaseConfigError } from './firebaseClient';
import type { LeaderboardProgress } from '../leaderboard/leaderboardProgress';

export interface StoredLeaderboardProgress extends LeaderboardProgress {
  uid: string;
  updatedAt: string;
}

const notConfiguredError = () =>
  firebaseConfigError ?? new Error('Firebase is not configured. Set VITE_FIREBASE_* in frontend/.env.local.');

// Pure payload builder kept separate from the Firestore call below, so the "only the
// calculateLeaderboardProgress() shape (+ uid/updatedAt) is ever written — never the raw
// AppState" guarantee can be unit tested without mocking Firestore.
export const buildProgressDocument = (uid: string, progress: LeaderboardProgress, now: string): StoredLeaderboardProgress => ({
  uid,
  dsa: progress.dsa,
  ddia: progress.ddia,
  helloInterview: progress.helloInterview,
  updatedAt: now,
});

export const syncLeaderboardProgress = async (uid: string, progress: LeaderboardProgress): Promise<void> => {
  if (!db) throw notConfiguredError();
  const payload = buildProgressDocument(uid, progress, new Date().toISOString());
  await setDoc(doc(db, 'leaderboardProgress', uid), payload);
};

// When Firebase isn't configured, report an empty leaderboard instead of leaving
// subscribers stuck with no callback at all.
export const subscribeAllProgress = (callback: (all: StoredLeaderboardProgress[]) => void): Unsubscribe => {
  if (!db) {
    callback([]);
    return () => {};
  }
  return onSnapshot(collection(db, 'leaderboardProgress'), (snapshot) => {
    callback(snapshot.docs.map((docSnapshot) => docSnapshot.data() as StoredLeaderboardProgress));
  });
};
