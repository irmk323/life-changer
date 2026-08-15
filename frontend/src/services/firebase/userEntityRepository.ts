import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where, type QueryConstraint } from 'firebase/firestore';
import { db, firebaseConfigError } from './firebaseClient';

const notConfiguredError = () =>
  firebaseConfigError ?? new Error('Firebase is not configured. Set VITE_FIREBASE_* in frontend/.env.local.');

// One document per entity — a full-document write here is correct (it *is* the save for
// that one item), not the "whole AppState in one document" anti-pattern.
export type UserEntityCollection =
  | 'weeklyPlanItems' | 'motivationEntries' | 'priorities' | 'activities'
  | 'functionalTasks' | 'systemDesignTasks';

export const listUserEntities = async <T>(
  uid: string,
  name: UserEntityCollection,
  constraints: QueryConstraint[] = [],
): Promise<T[]> => {
  if (!db) throw notConfiguredError();
  const snapshot = await getDocs(query(collection(db, 'userData', uid, name), ...constraints));
  return snapshot.docs.map((d) => d.data() as T);
};

// New entity only — id must not already exist. Field-level edits on an existing entity
// should use updateUserEntityFields instead, so a concurrent edit on another device to a
// different field of the same entity isn't clobbered by a stale full-document write.
export const createUserEntity = async (uid: string, name: UserEntityCollection, item: { id: string } & Record<string, unknown>): Promise<void> => {
  if (!db) throw notConfiguredError();
  await setDoc(doc(db, 'userData', uid, name, item.id), item);
};

export const updateUserEntityFields = async (
  uid: string,
  name: UserEntityCollection,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> => {
  if (!db) throw notConfiguredError();
  await setDoc(doc(db, 'userData', uid, name, id), patch, { merge: true });
};

export const deleteUserEntity = async (uid: string, name: UserEntityCollection, id: string): Promise<void> => {
  if (!db) throw notConfiguredError();
  await deleteDoc(doc(db, 'userData', uid, name, id));
};

export const listWeeklyPlanItemsForRange = <T>(uid: string, startDate: string, endDate: string): Promise<T[]> =>
  listUserEntities<T>(uid, 'weeklyPlanItems', [where('date', '>=', startDate), where('date', '<=', endDate)]);

// dailyLogs are keyed by date (doc id = date string) rather than a generated id, and are
// lazily loaded only for the currently-selected calendar day.
export const getDailyLog = async (uid: string, date: string): Promise<{ note: string; updatedAt: string } | null> => {
  if (!db) throw notConfiguredError();
  const snapshot = await getDoc(doc(db, 'userData', uid, 'dailyLogs', date));
  return snapshot.exists() ? (snapshot.data() as { note: string; updatedAt: string }) : null;
};

export const saveDailyLog = async (uid: string, date: string, note: string): Promise<void> => {
  if (!db) throw notConfiguredError();
  await setDoc(doc(db, 'userData', uid, 'dailyLogs', date), { note, updatedAt: new Date().toISOString() }, { merge: true });
};

// Full collection read/clear — only for JSON export and "reset my data"/import, never for
// everyday page rendering (which lazily loads one day's note at a time).
export const listAllDailyLogs = async (uid: string): Promise<Record<string, { note: string; updatedAt: string }>> => {
  if (!db) throw notConfiguredError();
  const snapshot = await getDocs(collection(db, 'userData', uid, 'dailyLogs'));
  return Object.fromEntries(snapshot.docs.map((d) => [d.id, d.data() as { note: string; updatedAt: string }]));
};

export const deleteDailyLog = async (uid: string, date: string): Promise<void> => {
  if (!db) throw notConfiguredError();
  await deleteDoc(doc(db, 'userData', uid, 'dailyLogs', date));
};
