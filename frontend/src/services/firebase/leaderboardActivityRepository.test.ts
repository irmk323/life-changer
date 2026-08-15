import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildActivityDocument, postLeaderboardActivity, subscribeRecentActivities } from './leaderboardActivityRepository';

const { addDoc, collection, limit, onSnapshot, orderBy, query } = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(() => ({ path: 'leaderboardActivities' })),
  limit: vi.fn((n: number) => ({ limit: n })),
  onSnapshot: vi.fn(),
  orderBy: vi.fn((field: string, dir: string) => ({ field, dir })),
  query: vi.fn((...args: unknown[]) => ({ args })),
}));

vi.mock('firebase/firestore', () => ({ addDoc, collection, limit, onSnapshot, orderBy, query }));

const firebaseClientMock = vi.hoisted(() => ({ db: {} as object | null, firebaseConfigError: null as Error | null }));
vi.mock('./firebaseClient', () => firebaseClientMock);

const sampleEvent = { domain: 'DDIA' as const, label: 'DDIA Chapter 7', occurredAt: '2026-08-08T00:00:00.000Z' };

describe('buildActivityDocument (whitelist)', () => {
  it('only contains uid, domain, label, occurredAt', () => {
    const result = buildActivityDocument('u1', sampleEvent);
    expect(Object.keys(result).sort()).toEqual(['domain', 'label', 'occurredAt', 'uid']);
    expect(result).toEqual({ uid: 'u1', ...sampleEvent });
  });
});

describe('leaderboardActivityRepository Firestore calls', () => {
  beforeEach(() => {
    addDoc.mockReset().mockResolvedValue(undefined);
    onSnapshot.mockReset();
    firebaseClientMock.db = {};
    firebaseClientMock.firebaseConfigError = null;
  });

  it('postLeaderboardActivity writes only the whitelisted document shape', async () => {
    await postLeaderboardActivity('u1', sampleEvent);
    expect(addDoc).toHaveBeenCalledTimes(1);
    const written = addDoc.mock.calls[0][1];
    expect(Object.keys(written).sort()).toEqual(['domain', 'label', 'occurredAt', 'uid']);
    expect(written.uid).toBe('u1');
  });

  it('postLeaderboardActivity rejects with a clear error instead of touching Firestore when unconfigured', async () => {
    firebaseClientMock.db = null;
    firebaseClientMock.firebaseConfigError = new Error('Missing required Firebase environment variable(s): VITE_FIREBASE_API_KEY');
    await expect(postLeaderboardActivity('u1', sampleEvent)).rejects.toThrow('VITE_FIREBASE_API_KEY');
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('subscribeRecentActivities maps snapshot docs to plain activity records', () => {
    const docs = [{ data: () => ({ uid: 'u1', ...sampleEvent }) }];
    onSnapshot.mockImplementation((_ref: unknown, next: (snap: { docs: typeof docs }) => void) => {
      next({ docs });
      return () => {};
    });
    const callback = vi.fn();
    subscribeRecentActivities(20, callback);
    expect(callback).toHaveBeenCalledWith([{ uid: 'u1', ...sampleEvent }]);
    expect(orderBy).toHaveBeenCalledWith('occurredAt', 'desc');
    expect(limit).toHaveBeenCalledWith(20);
  });

  it('subscribeRecentActivities reports an empty list instead of hanging when Firebase is not configured', () => {
    firebaseClientMock.db = null;
    const callback = vi.fn();
    subscribeRecentActivities(20, callback);
    expect(callback).toHaveBeenCalledWith([]);
    expect(onSnapshot).not.toHaveBeenCalled();
  });
});
