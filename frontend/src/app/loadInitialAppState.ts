import type { AppState, Activity, MotivationEntry, Priority, Task, WeeklyPlanItem } from '../types/appState';
import { getDomainState } from '../services/firebase/userDataRepository';
import { createUserEntity, listUserEntities } from '../services/firebase/userEntityRepository';
import { assembleCoreAppState, type DashboardDomainState, type DdiaDomainState, type RawDomainState } from './assembleAppState';
import { BUILT_IN_HELLO_INTERVIEW_TITLES, STARTER_FUNCTIONAL_TASK_TITLES } from '../data/sampleData';

// First-time-user seeding: Hello Interview's built-in task list and Functional Coding's
// starter tasks are full Firestore entities (unlike DSA/DDIA/questions, which stay in
// static JSON + a lightweight domainState overlay), so a brand-new user's collections
// start empty and need this one-time seed. Idempotent: only runs when the collection is
// still empty, so it never re-seeds over a user's own edits/deletions.
const seedSystemDesignTasks = async (uid: string): Promise<Task[]> => {
  const tasks: Task[] = BUILT_IN_HELLO_INTERVIEW_TITLES.map((title, i) => ({
    id: `design-${i + 1}`, title, category: 'System design', statement: `Design a scalable ${title}.`,
    notes: '', status: 'NOT_STARTED', attempts: [], source: 'BUILT_IN',
  }));
  await Promise.all(tasks.map((t) => createUserEntity(uid, 'systemDesignTasks', t)));
  return tasks;
};

const seedFunctionalTasks = async (uid: string): Promise<Task[]> => {
  const tasks: Task[] = STARTER_FUNCTIONAL_TASK_TITLES.map((title, i) => ({
    id: `functional-${i + 1}`, title, category: 'Backend exercise', tags: '',
    statement: `Design and implement a small ${title}.`, requirements: '', nonFunctional: '',
    entities: '', services: '', repositories: '', api: '', validation: '', errors: '', tests: '',
    notes: '', link: '', improvement: '', status: 'NOT_STARTED', attempts: [],
  }));
  await Promise.all(tasks.map((t) => createUserEntity(uid, 'functionalTasks', t)));
  return tasks;
};

// Everything an authenticated user needs up front: 7 lightweight domainState documents
// plus the small entity collections, all fetched in parallel. dailyLogs and per-item
// answers/dsaNotes are intentionally NOT loaded here — those are fetched lazily by the
// page that needs them (see answersRepository.ts / dsaNotesRepository.ts / CalendarPage).
export const loadInitialAppState = async (uid: string): Promise<AppState> => {
  const [
    dsaRaw, ddiaRaw, behaviour, javaCore, javaSpring, helloInterview, dashboardRaw,
    priorities, activities, motivationEntries, weeklyPlanItems, functionalTasksLoaded, systemDesignTasksLoaded,
  ] = await Promise.all([
    getDomainState(uid, 'dsa'),
    getDomainState(uid, 'ddia'),
    getDomainState(uid, 'behaviour'),
    getDomainState(uid, 'javaCore'),
    getDomainState(uid, 'javaSpring'),
    getDomainState(uid, 'helloInterview'),
    getDomainState(uid, 'dashboard'),
    listUserEntities<Priority>(uid, 'priorities'),
    listUserEntities<Activity>(uid, 'activities'),
    listUserEntities<MotivationEntry>(uid, 'motivationEntries'),
    listUserEntities<WeeklyPlanItem>(uid, 'weeklyPlanItems'),
    listUserEntities<Task>(uid, 'functionalTasks'),
    listUserEntities<Task>(uid, 'systemDesignTasks'),
  ]);

  const ddia: DdiaDomainState = { chapters: (ddiaRaw as Partial<DdiaDomainState>).chapters ?? {}, questions: (ddiaRaw as Partial<DdiaDomainState>).questions ?? {} };
  const dashboard: DashboardDomainState = { dismissedAutomaticPriorities: (dashboardRaw as Partial<DashboardDomainState>).dismissedAutomaticPriorities ?? [] };

  const raw: RawDomainState = {
    dsa: dsaRaw as RawDomainState['dsa'],
    ddia, behaviour: behaviour as RawDomainState['behaviour'], javaCore: javaCore as RawDomainState['javaCore'],
    javaSpring: javaSpring as RawDomainState['javaSpring'], helloInterview: helloInterview as RawDomainState['helloInterview'],
    dashboard,
  };
  const core = assembleCoreAppState(raw);

  const [functionalTasks, systemDesignTasks] = await Promise.all([
    functionalTasksLoaded.length ? Promise.resolve(functionalTasksLoaded) : seedFunctionalTasks(uid),
    systemDesignTasksLoaded.length ? Promise.resolve(systemDesignTasksLoaded) : seedSystemDesignTasks(uid),
  ]);

  return {
    version: 1,
    motivationEntries, attempts: [], reviews: [],
    dailyLogs: [],
    weeklyPlanItems, activities, priorities,
    functionalTasks, systemDesignTasks,
    ...core,
  };
};
