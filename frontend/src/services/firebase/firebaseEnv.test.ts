import { describe, expect, it } from 'vitest';
import { readFirebaseConfig, type FirebaseEnvVars } from './firebaseEnv';

const validEnv: FirebaseEnvVars = {
  VITE_FIREBASE_API_KEY: 'api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'project',
  VITE_FIREBASE_STORAGE_BUCKET: 'project.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef',
};

describe('readFirebaseConfig', () => {
  it('maps all required VITE_FIREBASE_* env vars to a FirebaseWebConfig', () => {
    expect(readFirebaseConfig(validEnv)).toEqual({
      apiKey: 'api-key',
      authDomain: 'project.firebaseapp.com',
      projectId: 'project',
      storageBucket: 'project.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef',
    });
  });

  it('throws a clear error naming every missing env var', () => {
    const env = { ...validEnv, VITE_FIREBASE_API_KEY: undefined, VITE_FIREBASE_APP_ID: undefined };
    expect(() => readFirebaseConfig(env)).toThrow('VITE_FIREBASE_API_KEY');
    expect(() => readFirebaseConfig(env)).toThrow('VITE_FIREBASE_APP_ID');
  });

  it('treats an empty string the same as a missing value', () => {
    expect(() => readFirebaseConfig({ ...validEnv, VITE_FIREBASE_PROJECT_ID: '' })).toThrow('VITE_FIREBASE_PROJECT_ID');
  });
});
