import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db, firebaseConfigError } from './firebaseClient';

export interface LearningAnswer {
  personalAnswer: string;
  notes: string;
  followUps: string;
  updatedAt: string;
}

const notConfiguredError = () =>
  firebaseConfigError ?? new Error('Firebase is not configured. Set VITE_FIREBASE_* in frontend/.env.local.');

// Lazily loaded — only fetched when a QuestionRow is opened/edited, never up front for a
// whole list, since personalAnswer/notes/followUps can be long free text.
export const getAnswer = async (uid: string, itemId: string): Promise<LearningAnswer | null> => {
  if (!db) throw notConfiguredError();
  const snapshot = await getDoc(doc(db, 'userData', uid, 'answers', itemId));
  return snapshot.exists() ? (snapshot.data() as LearningAnswer) : null;
};

export const saveAnswer = async (
  uid: string,
  itemId: string,
  patch: Partial<Pick<LearningAnswer, 'personalAnswer' | 'notes' | 'followUps'>>,
): Promise<void> => {
  if (!db) throw notConfiguredError();
  await setDoc(doc(db, 'userData', uid, 'answers', itemId), { ...patch, updatedAt: new Date().toISOString() }, { merge: true });
};

// Full collection read/clear — only for JSON export and "reset my data"/import, never for
// everyday page rendering (which lazily loads one answer at a time via getAnswer).
export const listAllAnswers = async (uid: string): Promise<Record<string, LearningAnswer>> => {
  if (!db) throw notConfiguredError();
  const snapshot = await getDocs(collection(db, 'userData', uid, 'answers'));
  return Object.fromEntries(snapshot.docs.map((d) => [d.id, d.data() as LearningAnswer]));
};

export const deleteAnswer = async (uid: string, itemId: string): Promise<void> => {
  if (!db) throw notConfiguredError();
  await deleteDoc(doc(db, 'userData', uid, 'answers', itemId));
};
