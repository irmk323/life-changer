import { collection, doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db, firebaseConfigError } from './firebaseClient';
import type { LeaderboardProfile } from '../../types/leaderboard';

const notConfiguredError = () =>
  firebaseConfigError ?? new Error('Firebase is not configured. Set VITE_FIREBASE_* in frontend/.env.local.');

// Pure payload builders, kept separate from the Firestore calls below, so the
// "only these fields are ever written to profiles/{uid}" guarantee (no learning data,
// no stray fields) can be unit tested without mocking Firestore.
export const buildNewProfile = (uid: string, displayName: string, now: string): LeaderboardProfile => ({
  uid,
  displayName,
  createdAt: now,
  updatedAt: now,
});

export const buildProfileUpdate = (displayName: string, now: string): Pick<LeaderboardProfile, 'displayName' | 'updatedAt'> => ({
  displayName,
  updatedAt: now,
});

export const getProfile = async (uid: string): Promise<LeaderboardProfile | null> => {
  if (!db) throw notConfiguredError();
  const snapshot = await getDoc(doc(db, 'profiles', uid));
  return snapshot.exists() ? (snapshot.data() as LeaderboardProfile) : null;
};

export const createProfile = async (uid: string, displayName: string): Promise<LeaderboardProfile> => {
  if (!db) throw notConfiguredError();
  const profile = buildNewProfile(uid, displayName, new Date().toISOString());
  await setDoc(doc(db, 'profiles', uid), profile);
  return profile;
};

export const updateProfile = async (existing: LeaderboardProfile, displayName: string): Promise<LeaderboardProfile> => {
  if (!db) throw notConfiguredError();
  const update = buildProfileUpdate(displayName, new Date().toISOString());
  await setDoc(doc(db, 'profiles', existing.uid), update, { merge: true });
  return { ...existing, ...update };
};

// Used to show other people's display names on the Leaderboard. When Firebase isn't
// configured, report an empty list instead of leaving subscribers with no callback at all.
export const subscribeAllProfiles = (callback: (all: LeaderboardProfile[]) => void): Unsubscribe => {
  if (!db) {
    callback([]);
    return () => {};
  }
  return onSnapshot(collection(db, 'profiles'), (snapshot) => {
    callback(snapshot.docs.map((docSnapshot) => docSnapshot.data() as LeaderboardProfile));
  });
};
