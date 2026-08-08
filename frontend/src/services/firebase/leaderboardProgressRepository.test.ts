import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildProgressDocument, subscribeAllProgress, syncLeaderboardProgress } from './leaderboardProgressRepository';

const { getDoc, setDoc, doc, collection, onSnapshot } = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(() => ({ path: 'leaderboardProgress/mock' })),
  collection: vi.fn(() => ({ path: 'leaderboardProgress' })),
  onSnapshot: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({ getDoc, setDoc, doc, collection, onSnapshot }));

const firebaseClientMock = vi.hoisted(() => ({ db: {} as object | null, firebaseConfigError: null as Error | null }));
vi.mock('./firebaseClient', () => firebaseClientMock);

const sampleProgress = {
  dsa: { completed: 5, total: 150, percentage: 3 },
  ddia: { completed: 2, total: 12, percentage: 17 },
  helloInterview: { completed: 0, total: 31, percentage: 0 },
};

describe('buildProgressDocument (whitelist)', () => {
  it('only contains uid, dsa, ddia, helloInterview, updatedAt — never raw AppState', () => {
    const result = buildProgressDocument('u1', sampleProgress, '2026-08-08T00:00:00.000Z');
    expect(Object.keys(result).sort()).toEqual(['ddia', 'dsa', 'helloInterview', 'uid', 'updatedAt']);
    expect(result).toEqual({ uid: 'u1', updatedAt: '2026-08-08T00:00:00.000Z', ...sampleProgress });
  });
});

describe('leaderboardProgressRepository Firestore calls', () => {
  beforeEach(() => {
    setDoc.mockReset().mockResolvedValue(undefined);
    onSnapshot.mockReset();
    firebaseClientMock.db = {};
    firebaseClientMock.firebaseConfigError = null;
  });

  it('syncLeaderboardProgress writes only the whitelisted document shape', async () => {
    await syncLeaderboardProgress('u1', sampleProgress);
    expect(setDoc).toHaveBeenCalledTimes(1);
    const written = setDoc.mock.calls[0][1];
    expect(Object.keys(written).sort()).toEqual(['ddia', 'dsa', 'helloInterview', 'uid', 'updatedAt']);
    expect(written.uid).toBe('u1');
  });

  it('syncLeaderboardProgress rejects with a clear error instead of touching Firestore when unconfigured', async () => {
    firebaseClientMock.db = null;
    firebaseClientMock.firebaseConfigError = new Error('Missing required Firebase environment variable(s): VITE_FIREBASE_API_KEY');
    await expect(syncLeaderboardProgress('u1', sampleProgress)).rejects.toThrow('VITE_FIREBASE_API_KEY');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('subscribeAllProgress maps snapshot docs to plain progress records', () => {
    const docs = [{ data: () => ({ uid: 'u1', ...sampleProgress, updatedAt: 'a' }) }];
    onSnapshot.mockImplementation((_ref: unknown, next: (snap: { docs: typeof docs }) => void) => {
      next({ docs });
      return () => {};
    });
    const callback = vi.fn();
    subscribeAllProgress(callback);
    expect(callback).toHaveBeenCalledWith([{ uid: 'u1', ...sampleProgress, updatedAt: 'a' }]);
  });

  it('subscribeAllProgress reports an empty list instead of hanging when Firebase is not configured', () => {
    firebaseClientMock.db = null;
    const callback = vi.fn();
    subscribeAllProgress(callback);
    expect(callback).toHaveBeenCalledWith([]);
    expect(onSnapshot).not.toHaveBeenCalled();
  });
});
