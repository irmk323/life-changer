import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDomainStateField, getDomainState, setDomainState, updateDomainStateField } from './userDataRepository';

const { getDoc, setDoc, doc, deleteField } = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn((...args: unknown[]) => ({ path: args.join('/') })),
  deleteField: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({ getDoc, setDoc, doc, deleteField }));

const firebaseClientMock = vi.hoisted(() => ({ db: {} as object | null, firebaseConfigError: null as Error | null }));
vi.mock('./firebaseClient', () => firebaseClientMock);

describe('userDataRepository', () => {
  beforeEach(() => {
    getDoc.mockReset();
    setDoc.mockReset().mockResolvedValue(undefined);
    firebaseClientMock.db = {};
    firebaseClientMock.firebaseConfigError = null;
  });

  it('getDomainState returns {} when the document does not exist yet (fresh user)', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    expect(await getDomainState('u1', 'dsa')).toEqual({});
  });

  it('getDomainState returns the stored map when it exists', async () => {
    const stored = { 'two-sum': { firstSolvedAt: '2026-08-01', reviews: [] } };
    getDoc.mockResolvedValue({ exists: () => true, data: () => stored });
    expect(await getDomainState('u1', 'dsa')).toEqual(stored);
  });

  it('updateDomainStateField writes a genuinely nested object for a multi-segment path, never a dotted key', async () => {
    // setDoc(ref, data, {merge: true}) does NOT interpret a dotted string key as a nested
    // field path (only updateDoc does) — a dotted key would silently create a useless
    // literal field and never actually update the real nested value. Regression test for
    // that production bug: assert the write is a real nested object.
    await updateDomainStateField('u1', 'dsa', 'two-sum.firstSolvedAt', '2026-08-08');
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, written, opts] = setDoc.mock.calls[0];
    expect(written).toEqual({ 'two-sum': { firstSolvedAt: '2026-08-08' } });
    expect(Object.keys(written)).not.toContain('two-sum.firstSolvedAt');
    expect(opts).toEqual({ merge: true });
  });

  it('updateDomainStateField nests correctly for a three-segment path (e.g. DDIA chapter status)', async () => {
    await updateDomainStateField('u1', 'ddia', 'chapters.CHAPTER_1.status', 'DONE');
    const written = setDoc.mock.calls[0][1];
    expect(written).toEqual({ chapters: { CHAPTER_1: { status: 'DONE' } } });
  });

  it('updateDomainStateField writes a plain top-level field for a single-segment path (no dot)', async () => {
    await updateDomainStateField('u1', 'dashboard', 'dismissedAutomaticPriorities', ['p1']);
    const written = setDoc.mock.calls[0][1];
    expect(written).toEqual({ dismissedAutomaticPriorities: ['p1'] });
  });

  it('deleteDomainStateField removes only the given nested field, not the whole document', async () => {
    const sentinel = Symbol('deleteField-sentinel');
    deleteField.mockReturnValue(sentinel);
    await deleteDomainStateField('u1', 'behaviour', 'custom-id-1');
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, written, opts] = setDoc.mock.calls[0];
    expect(written).toEqual({ 'custom-id-1': sentinel });
    expect(opts).toEqual({ merge: true });
  });

  it('deleteDomainStateField nests the deleteField() sentinel for a multi-segment path', async () => {
    const sentinel = Symbol('deleteField-sentinel');
    deleteField.mockReturnValue(sentinel);
    await deleteDomainStateField('u1', 'ddia', 'questions.ddia-3-q1');
    const written = setDoc.mock.calls[0][1];
    expect(written).toEqual({ questions: { 'ddia-3-q1': sentinel } });
  });

  it('setDomainState replaces the whole document (only used for reset/import)', async () => {
    await setDomainState('u1', 'dsa', { 'two-sum': { firstSolvedAt: null, reviews: [] } });
    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc.mock.calls[0][2]).toBeUndefined();
  });

  it('rejects with a clear error instead of touching Firestore when unconfigured', async () => {
    firebaseClientMock.db = null;
    firebaseClientMock.firebaseConfigError = new Error('Missing required Firebase environment variable(s): VITE_FIREBASE_API_KEY');
    await expect(getDomainState('u1', 'dsa')).rejects.toThrow('VITE_FIREBASE_API_KEY');
    expect(getDoc).not.toHaveBeenCalled();
  });
});
