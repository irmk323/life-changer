import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAnswer, saveAnswer } from './answersRepository';

const { getDoc, setDoc, doc } = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn((...args: unknown[]) => ({ path: args.join('/') })),
}));

vi.mock('firebase/firestore', () => ({ getDoc, setDoc, doc }));

const firebaseClientMock = vi.hoisted(() => ({ db: {} as object | null, firebaseConfigError: null as Error | null }));
vi.mock('./firebaseClient', () => firebaseClientMock);

describe('answersRepository', () => {
  beforeEach(() => {
    getDoc.mockReset();
    setDoc.mockReset().mockResolvedValue(undefined);
    firebaseClientMock.db = {};
    firebaseClientMock.firebaseConfigError = null;
  });

  it('getAnswer returns null when nothing has been saved for this item yet', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    expect(await getAnswer('u1', 'java-core-1')).toBeNull();
  });

  it('getAnswer returns the stored answer', async () => {
    const stored = { personalAnswer: 'my answer', notes: 'n', followUps: 'f', updatedAt: 'a' };
    getDoc.mockResolvedValue({ exists: () => true, data: () => stored });
    expect(await getAnswer('u1', 'java-core-1')).toEqual(stored);
  });

  it('saveAnswer merges only the patched fields plus updatedAt', async () => {
    await saveAnswer('u1', 'java-core-1', { personalAnswer: 'updated' });
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, written, opts] = setDoc.mock.calls[0];
    expect(Object.keys(written).sort()).toEqual(['personalAnswer', 'updatedAt']);
    expect(written.personalAnswer).toBe('updated');
    expect(opts).toEqual({ merge: true });
  });

  it('rejects with a clear error instead of touching Firestore when unconfigured', async () => {
    firebaseClientMock.db = null;
    firebaseClientMock.firebaseConfigError = new Error('Missing required Firebase environment variable(s): VITE_FIREBASE_API_KEY');
    await expect(saveAnswer('u1', 'x', { notes: 'x' })).rejects.toThrow('VITE_FIREBASE_API_KEY');
    expect(setDoc).not.toHaveBeenCalled();
  });
});
