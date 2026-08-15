import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, firebaseConfigError } from './firebaseClient';

const googleProvider = new GoogleAuthProvider();

const notConfiguredError = () =>
  firebaseConfigError ?? new Error('Firebase is not configured. Set VITE_FIREBASE_* in frontend/.env.local.');

// signInWithPopup is blocked by some browsers/extensions; if that becomes a real problem for
// users, switch to signInWithRedirect + getRedirectResult here (kept as popup for now since it
// keeps the rest of the app state untouched during sign-in).
export const signInWithGoogle = () => (auth ? signInWithPopup(auth, googleProvider) : Promise.reject(notConfiguredError()));

export const signOutUser = () => (auth ? signOut(auth) : Promise.resolve());

// When Firebase isn't configured, report "signed out" immediately instead of leaving
// callers stuck in a permanent loading state.
export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export type { User };
