import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDsaNotes, saveDsaNotes } from './dsaNotesRepository';

const { getDoc, setDoc, doc } = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn((...args: unknown[]) => ({ path: args.join('/') })),
}));

vi.mock('firebase/firestore', () => ({ getDoc, setDoc, doc }));

const firebaseClientMock = vi.hoisted(() => ({ db: {} as object | null, firebaseConfigError: null as Error | null }));
vi.mock('./firebaseClient', () => firebaseClientMock);

describe('dsaNotesRepository', () => {
  beforeEach(() => {
    getDoc.mockReset();
    setDoc.mockReset().mockResolvedValue(undefined);
    firebaseClientMock.db = {};
    firebaseClientMock.firebaseConfigError = null;
  });

  it('getDsaNotes returns null when nothing has been saved yet', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    expect(await getDsaNotes('u1', 'two-sum')).toBeNull();
  });

  it('saveDsaNotes writes a genuinely nested reviewNotes object (never a dotted key), so merge deep-merges other stages instead of leaving a stray literal field', async () => {
    await saveDsaNotes('u1', 'two-sum', { reviewNotes: { D1: 'updated' } });
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, written, opts] = setDoc.mock.calls[0];
    expect(written).toEqual({ updatedAt: expect.any(String), reviewNotes: { D1: 'updated' } });
    expect(Object.keys(written)).not.toContain('reviewNotes.D1');
    expect(opts).toEqual({ merge: true });
  });

  it('saveDsaNotes writes initialNotes/generalNotes as plain top-level fields', async () => {
    await saveDsaNotes('u1', 'two-sum', { initialNotes: 'a', generalNotes: 'b' });
    const written = setDoc.mock.calls[0][1];
    expect(written).toEqual({ updatedAt: expect.any(String), initialNotes: 'a', generalNotes: 'b' });
  });

  it('rejects with a clear error instead of touching Firestore when unconfigured', async () => {
    firebaseClientMock.db = null;
    firebaseClientMock.firebaseConfigError = new Error('Missing required Firebase environment variable(s): VITE_FIREBASE_API_KEY');
    await expect(saveDsaNotes('u1', 'x', { initialNotes: 'x' })).rejects.toThrow('VITE_FIREBASE_API_KEY');
    expect(setDoc).not.toHaveBeenCalled();
  });
});
