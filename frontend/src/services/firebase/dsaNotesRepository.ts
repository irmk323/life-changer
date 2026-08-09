import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db, firebaseConfigError } from './firebaseClient';

export interface DsaNotes {
  initialNotes: string;
  generalNotes: string;
  reviewNotes: { D1: string; D4: string; D17: string };
  updatedAt: string;
}

const notConfiguredError = () =>
  firebaseConfigError ?? new Error('Firebase is not configured. Set VITE_FIREBASE_* in frontend/.env.local.');

// Lazily loaded — only fetched when a DSA problem's detail page is opened.
export const getDsaNotes = async (uid: string, problemId: string): Promise<DsaNotes | null> => {
  if (!db) throw notConfiguredError();
  const snapshot = await getDoc(doc(db, 'userData', uid, 'dsaNotes', problemId));
  return snapshot.exists() ? (snapshot.data() as DsaNotes) : null;
};

export const saveDsaNotes = async (
  uid: string,
  problemId: string,
  patch: Partial<{ initialNotes: string; generalNotes: string; reviewNotes: Partial<DsaNotes['reviewNotes']> }>,
): Promise<void> => {
  if (!db) throw notConfiguredError();
  // A genuinely nested reviewNotes object, NOT a dotted key like {'reviewNotes.D1': note} —
  // setDoc(ref, data, {merge: true}) does not interpret dotted string keys as nested field
  // paths (only updateDoc does); it deep-merges real nested objects correctly instead,
  // preserving sibling stages (see userDataRepository.ts's buildNestedPatch for the same fix).
  const data: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (patch.initialNotes !== undefined) data.initialNotes = patch.initialNotes;
  if (patch.generalNotes !== undefined) data.generalNotes = patch.generalNotes;
  if (patch.reviewNotes) data.reviewNotes = { ...patch.reviewNotes };
  await setDoc(doc(db, 'userData', uid, 'dsaNotes', problemId), data, { merge: true });
};

// Full collection read/clear — only for JSON export and "reset my data"/import, never for
// everyday page rendering (which lazily loads one problem's notes at a time).
export const listAllDsaNotes = async (uid: string): Promise<Record<string, DsaNotes>> => {
  if (!db) throw notConfiguredError();
  const snapshot = await getDocs(collection(db, 'userData', uid, 'dsaNotes'));
  return Object.fromEntries(snapshot.docs.map((d) => [d.id, d.data() as DsaNotes]));
};

export const deleteDsaNotes = async (uid: string, problemId: string): Promise<void> => {
  if (!db) throw notConfiguredError();
  await deleteDoc(doc(db, 'userData', uid, 'dsaNotes', problemId));
};
