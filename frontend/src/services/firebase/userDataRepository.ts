import { deleteField, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseConfigError } from './firebaseClient';

const notConfiguredError = () =>
  firebaseConfigError ?? new Error('Firebase is not configured. Set VITE_FIREBASE_* in frontend/.env.local.');

export type DomainStateName = 'dsa' | 'ddia' | 'behaviour' | 'javaCore' | 'javaSpring' | 'helloInterview' | 'dashboard';

export const getDomainState = async (uid: string, name: DomainStateName): Promise<Record<string, unknown>> => {
  if (!db) throw notConfiguredError();
  const snapshot = await getDoc(doc(db, 'userData', uid, 'domainState', name));
  return snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : {};
};

// IMPORTANT: a dotted string key like {'a.b.c': value} is NOT interpreted as a nested
// field path by setDoc(ref, data, {merge: true}) — that's only guaranteed for updateDoc().
// Verified empirically against the live project: a dotted-key setDoc write creates one
// literal field literally named "a.b.c", leaving the real nested field untouched (this was
// the root cause of a production bug where DDIA chapter/DSA/learningItem field updates
// appeared to save but silently never persisted). We build a genuinely nested object
// instead — {merge: true} deep-merges nested map fields correctly, preserving sibling
// items/fields at every level (also verified empirically), which a concurrent edit from
// another device to a sibling item/field must never lose.
const buildNestedPatch = (fieldPath: string, value: unknown): Record<string, unknown> =>
  fieldPath.split('.').reduceRight<unknown>((acc, segment) => ({ [segment]: acc }), value) as Record<string, unknown>;

export const updateDomainStateField = async (uid: string, name: DomainStateName, fieldPath: string, value: unknown): Promise<void> => {
  if (!db) throw notConfiguredError();
  await setDoc(doc(db, 'userData', uid, 'domainState', name), buildNestedPatch(fieldPath, value), { merge: true });
};

export const deleteDomainStateField = async (uid: string, name: DomainStateName, fieldPath: string): Promise<void> => {
  if (!db) throw notConfiguredError();
  await setDoc(doc(db, 'userData', uid, 'domainState', name), buildNestedPatch(fieldPath, deleteField()), { merge: true });
};

// Full-document replace — only for "reset my data" and JSON import, never for everyday
// single-item edits (use updateDomainStateField for those).
export const setDomainState = async (uid: string, name: DomainStateName, value: Record<string, unknown>): Promise<void> => {
  if (!db) throw notConfiguredError();
  await setDoc(doc(db, 'userData', uid, 'domainState', name), value);
};
