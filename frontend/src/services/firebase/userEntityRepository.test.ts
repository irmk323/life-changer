import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUserEntity,
  deleteUserEntity,
  getDailyLog,
  listUserEntities,
  listWeeklyPlanItemsForRange,
  saveDailyLog,
  updateUserEntityFields,
} from './userEntityRepository';

const { getDoc, getDocs, setDoc, deleteDoc, doc, collection, query, where } = vi.hoisted(() => ({
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((...args: unknown[]) => ({ path: args.join('/') })),
  collection: vi.fn((...args: unknown[]) => ({ path: args.join('/') })),
  query: vi.fn((ref: unknown, ...constraints: unknown[]) => ({ ref, constraints })),
  where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));

vi.mock('firebase/firestore', () => ({ getDoc, getDocs, setDoc, deleteDoc, doc, collection, query, where }));

const firebaseClientMock = vi.hoisted(() => ({ db: {} as object | null, firebaseConfigError: null as Error | null }));
vi.mock('./firebaseClient', () => firebaseClientMock);

describe('userEntityRepository', () => {
  beforeEach(() => {
    getDoc.mockReset();
    getDocs.mockReset();
    setDoc.mockReset().mockResolvedValue(undefined);
    deleteDoc.mockReset().mockResolvedValue(undefined);
    firebaseClientMock.db = {};
    firebaseClientMock.firebaseConfigError = null;
  });

  it('listUserEntities maps snapshot docs to plain records', async () => {
    const docs = [{ data: () => ({ id: 'p1', title: 'x' }) }];
    getDocs.mockResolvedValue({ docs });
    expect(await listUserEntities('u1', 'priorities')).toEqual([{ id: 'p1', title: 'x' }]);
  });

  it('createUserEntity writes the full item document', async () => {
    await createUserEntity('u1', 'priorities', { id: 'p1', title: 'x' });
    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc.mock.calls[0][1]).toEqual({ id: 'p1', title: 'x' });
    expect(setDoc.mock.calls[0][2]).toBeUndefined();
  });

  it('updateUserEntityFields merges only the given fields (does not clobber a concurrent edit to a different field)', async () => {
    await updateUserEntityFields('u1', 'systemDesignTasks', 'design-1', { notes: 'updated' });
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, written, opts] = setDoc.mock.calls[0];
    expect(written).toEqual({ notes: 'updated' });
    expect(opts).toEqual({ merge: true });
  });

  it('deleteUserEntity removes the entity document', async () => {
    await deleteUserEntity('u1', 'priorities', 'p1');
    expect(deleteDoc).toHaveBeenCalledTimes(1);
  });

  it('listWeeklyPlanItemsForRange queries by date range', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    await listWeeklyPlanItemsForRange('u1', '2026-08-03', '2026-08-09');
    expect(where).toHaveBeenCalledWith('date', '>=', '2026-08-03');
    expect(where).toHaveBeenCalledWith('date', '<=', '2026-08-09');
  });

  it('getDailyLog returns null when no note exists for that date', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    expect(await getDailyLog('u1', '2026-08-08')).toBeNull();
  });

  it('saveDailyLog writes note + updatedAt keyed by date', async () => {
    await saveDailyLog('u1', '2026-08-08', 'felt clear today');
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'userData', 'u1', 'dailyLogs', '2026-08-08');
    const written = setDoc.mock.calls[0][1];
    expect(written.note).toBe('felt clear today');
  });

  it('rejects with a clear error instead of touching Firestore when unconfigured', async () => {
    firebaseClientMock.db = null;
    firebaseClientMock.firebaseConfigError = new Error('Missing required Firebase environment variable(s): VITE_FIREBASE_API_KEY');
    await expect(listUserEntities('u1', 'priorities')).rejects.toThrow('VITE_FIREBASE_API_KEY');
    expect(getDocs).not.toHaveBeenCalled();
  });
});
