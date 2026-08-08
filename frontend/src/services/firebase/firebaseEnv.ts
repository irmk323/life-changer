const REQUIRED_FIREBASE_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export type FirebaseEnvVars = Record<(typeof REQUIRED_FIREBASE_ENV_VARS)[number], string | undefined>;

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Pure config parsing kept separate from firebaseClient.ts (which calls initializeApp as a
// side effect at import time) so this validation logic can be unit tested in isolation.
export const readFirebaseConfig = (env: FirebaseEnvVars): FirebaseWebConfig => {
  const missing = REQUIRED_FIREBASE_ENV_VARS.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required Firebase environment variable(s): ${missing.join(', ')}. Copy frontend/.env.example to frontend/.env.local and fill in your Firebase project's web config.`,
    );
  }
  return {
    apiKey: env.VITE_FIREBASE_API_KEY!,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN!,
    projectId: env.VITE_FIREBASE_PROJECT_ID!,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
    appId: env.VITE_FIREBASE_APP_ID!,
  };
};
