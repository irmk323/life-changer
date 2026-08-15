import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildNewProfile, buildProfileUpdate, createProfile, getProfile, subscribeAllProfiles, updateProfile } from './profile';

const { getDoc, setDoc, doc, collection, onSnapshot } = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(() => ({ path: 'profiles/mock' })),
  collection: vi.fn(() => ({ path: 'profiles' })),
  onSnapshot: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({ getDoc, setDoc, doc, collection, onSnapshot }));

const firebaseClientMock = vi.hoisted(() => ({ db: {} as object | null, firebaseConfigError: null as Error | null }));
vi.mock('./firebaseClient', () => firebaseClientMock);

describe('profile payload builders (whitelist)', () => {
  it('buildNewProfile only contains uid, displayName, createdAt, updatedAt', () => {
    const result = buildNewProfile('u1', 'Maki', '2026-08-08T00:00:00.000Z');
    expect(result).toEqual({ uid: 'u1', displayName: 'Maki', createdAt: '2026-08-08T00:00:00.000Z', updatedAt: '2026-08-08T00:00:00.000Z' });
    expect(Object.keys(result).sort()).toEqual(['createdAt', 'displayName', 'uid', 'updatedAt']);
  });

  it('buildProfileUpdate only contains displayName and updatedAt', () => {
    const result = buildProfileUpdate('New Name', '2026-08-08T00:00:00.000Z');
    expect(Object.keys(result).sort()).toEqual(['displayName', 'updatedAt']);
  });
});

describe('profile Firestore repository', () => {
  beforeEach(() => {
    getDoc.mockReset();
    setDoc.mockReset().mockResolvedValue(undefined);
    onSnapshot.mockReset();
    firebaseClientMock.db = {};
    firebaseClientMock.firebaseConfigError = null;
  });

  it('getProfile returns null when the document does not exist', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    expect(await getProfile('u1')).toBeNull();
  });

  it('getProfile returns the stored data when the document exists', async () => {
    const stored = { uid: 'u1', displayName: 'Maki', createdAt: 'a', updatedAt: 'a' };
    getDoc.mockResolvedValue({ exists: () => true, data: () => stored });
    expect(await getProfile('u1')).toEqual(stored);
  });

  it('createProfile writes only the whitelisted fields to Firestore', async () => {
    await createProfile('u1', 'Maki');
    expect(setDoc).toHaveBeenCalledTimes(1);
    const written = setDoc.mock.calls[0][1];
    expect(Object.keys(written).sort()).toEqual(['createdAt', 'displayName', 'uid', 'updatedAt']);
    expect(written.uid).toBe('u1');
    expect(written.displayName).toBe('Maki');
  });

  it('updateProfile writes only displayName/updatedAt as a merge, keeping the rest locally', async () => {
    const existing = { uid: 'u1', displayName: 'Old', createdAt: 'created-at', updatedAt: 'old-updated-at' };
    const result = await updateProfile(existing, 'New Name');
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, written, opts] = setDoc.mock.calls[0];
    expect(Object.keys(written).sort()).toEqual(['displayName', 'updatedAt']);
    expect(opts).toEqual({ merge: true });
    expect(result).toEqual({ uid: 'u1', displayName: 'New Name', createdAt: 'created-at', updatedAt: written.updatedAt });
  });

  it('rejects with a clear error instead of touching Firestore when Firebase is not configured', async () => {
    firebaseClientMock.db = null;
    firebaseClientMock.firebaseConfigError = new Error('Missing required Firebase environment variable(s): VITE_FIREBASE_API_KEY');
    await expect(getProfile('u1')).rejects.toThrow('VITE_FIREBASE_API_KEY');
    expect(getDoc).not.toHaveBeenCalled();
  });

  it('subscribeAllProfiles maps snapshot docs to plain profile records', () => {
    const docs = [{ data: () => ({ uid: 'u1', displayName: 'Maki', createdAt: 'a', updatedAt: 'a' }) }];
    onSnapshot.mockImplementation((_ref: unknown, next: (snap: { docs: typeof docs }) => void) => {
      next({ docs });
      return () => {};
    });
    const callback = vi.fn();
    subscribeAllProfiles(callback);
    expect(callback).toHaveBeenCalledWith([{ uid: 'u1', displayName: 'Maki', createdAt: 'a', updatedAt: 'a' }]);
  });

  it('subscribeAllProfiles reports an empty list instead of hanging when Firebase is not configured', () => {
    firebaseClientMock.db = null;
    const callback = vi.fn();
    subscribeAllProfiles(callback);
    expect(callback).toHaveBeenCalledWith([]);
    expect(onSnapshot).not.toHaveBeenCalled();
  });
});
