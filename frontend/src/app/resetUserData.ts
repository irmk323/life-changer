import { setDomainState, type DomainStateName } from '../services/firebase/userDataRepository';
import { deleteUserEntity, listUserEntities, listAllDailyLogs, deleteDailyLog, type UserEntityCollection } from '../services/firebase/userEntityRepository';
import { listAllAnswers, deleteAnswer } from '../services/firebase/answersRepository';
import { listAllDsaNotes, deleteDsaNotes } from '../services/firebase/dsaNotesRepository';

const EMPTY_DOMAIN_STATES: Record<DomainStateName, Record<string, unknown>> = {
  dsa: {}, ddia: { chapters: {}, questions: {} }, behaviour: {}, javaCore: {}, javaSpring: {},
  helloInterview: {}, dashboard: { dismissedAutomaticPriorities: [] },
};

const clearEntityCollection = async (uid: string, name: UserEntityCollection): Promise<void> => {
  const items = await listUserEntities<{ id: string }>(uid, name);
  await Promise.all(items.map((item) => deleteUserEntity(uid, name, item.id)));
};

const clearAnswers = async (uid: string): Promise<void> => {
  const answers = await listAllAnswers(uid);
  await Promise.all(Object.keys(answers).map((itemId) => deleteAnswer(uid, itemId)));
};

const clearDsaNotes = async (uid: string): Promise<void> => {
  const notes = await listAllDsaNotes(uid);
  await Promise.all(Object.keys(notes).map((problemId) => deleteDsaNotes(uid, problemId)));
};

const clearDailyLogs = async (uid: string): Promise<void> => {
  const logs = await listAllDailyLogs(uid);
  await Promise.all(Object.keys(logs).map((date) => deleteDailyLog(uid, date)));
};

// "Reset my data": clears every private Firestore document for this user back to a fresh
// default — every domainState doc, every entity collection, and the free-text
// answers/dsaNotes/dailyLogs collections. functionalTasks/systemDesignTasks are cleared
// (not re-seeded here) — the next loadInitialAppState() call re-seeds them automatically
// since their collections are empty again, so callers must reload state after this
// resolves. Also reused by JSON import as the "replace all current data" step.
export const resetMyData = async (uid: string): Promise<void> => {
  await Promise.all([
    ...Object.entries(EMPTY_DOMAIN_STATES).map(([name, value]) => setDomainState(uid, name as DomainStateName, value)),
    clearEntityCollection(uid, 'priorities'),
    clearEntityCollection(uid, 'activities'),
    clearEntityCollection(uid, 'motivationEntries'),
    clearEntityCollection(uid, 'weeklyPlanItems'),
    clearEntityCollection(uid, 'functionalTasks'),
    clearEntityCollection(uid, 'systemDesignTasks'),
    clearAnswers(uid),
    clearDsaNotes(uid),
    clearDailyLogs(uid),
  ]);
};
