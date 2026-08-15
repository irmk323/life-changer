import { initializeApp, type FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { readFirebaseConfig } from './firebaseEnv';

// Missing VITE_FIREBASE_* env vars must not crash the whole app at module-load time —
// every non-Leaderboard page has to keep working without Firebase configured. So the
// config/init error is captured here and only surfaced when something actually tries to
// use Firebase (see auth.ts), instead of throwing during import.
let firebaseApp: FirebaseApp | null = null;
export let firebaseConfigError: Error | null = null;

try {
  firebaseApp = initializeApp(readFirebaseConfig(import.meta.env));
} catch (err) {
  firebaseConfigError = err instanceof Error ? err : new Error(String(err));
}

export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

// Keep the session in this browser/origin until the user explicitly signs out (per Phase
// 2G auth requirements), rather than Firebase's SSO-style default of clearing on tab close.
if (auth) {
  void setPersistence(auth, browserLocalPersistence);
}
