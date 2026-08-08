import { afterEach, describe, expect, it, vi } from 'vitest';

const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

describe('firebaseClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('does not throw at import time when VITE_FIREBASE_* env vars are missing, and records the error instead of initializing', async () => {
    REQUIRED_KEYS.forEach((key) => vi.stubEnv(key, ''));
    const mod = await import('./firebaseClient');
    expect(mod.auth).toBeNull();
    expect(mod.db).toBeNull();
    expect(mod.firebaseConfigError).toBeInstanceOf(Error);
    expect(mod.firebaseConfigError?.message).toContain('VITE_FIREBASE_API_KEY');
  });

  it('initializes Auth and Firestore once all required env vars are present', async () => {
    REQUIRED_KEYS.forEach((key) => vi.stubEnv(key, key === 'VITE_FIREBASE_PROJECT_ID' ? 'demo-project' : 'demo-value'));
    const mod = await import('./firebaseClient');
    expect(mod.auth).not.toBeNull();
    expect(mod.db).not.toBeNull();
    expect(mod.firebaseConfigError).toBeNull();
  });
});
