import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppState } from '../types/appState';
import { syncActionToFirestore } from './firestoreActionSync';

const {
  updateDomainStateField, deleteDomainStateField,
  saveAnswer,
  createUserEntity, updateUserEntityFields, deleteUserEntity, saveDailyLog,
} = vi.hoisted(() => ({
  updateDomainStateField: vi.fn(),
  deleteDomainStateField: vi.fn(),
  saveAnswer: vi.fn(),
  createUserEntity: vi.fn(),
  updateUserEntityFields: vi.fn(),
  deleteUserEntity: vi.fn(),
  saveDailyLog: vi.fn(),
}));

vi.mock('../services/firebase/userDataRepository', () => ({ updateDomainStateField, deleteDomainStateField }));
vi.mock('../services/firebase/answersRepository', () => ({ saveAnswer }));
vi.mock('../services/firebase/userEntityRepository', () => ({ createUserEntity, updateUserEntityFields, deleteUserEntity, saveDailyLog }));

const baseState = (overrides: Partial<AppState> = {}): AppState => ({
  version: 1, motivationEntries: [], learningItems: [], attempts: [], reviews: [],
  dsa: [], dailyLogs: [], weeklyPlanItems: [], activities: [], priorities: [],
  dismissedAutomaticPriorities: [], functionalTasks: [], systemDesignTasks: [], ddiaChapters: [],
  ...overrides,
});

const learningItem = (id: string, domain: AppState['learningItems'][number]['domain'], track: string) => ({
  id, domain, track, title: id, question: id, category: 'c', priority: 'P1', modelAnswer: '',
  personalAnswer: '', notes: '', followUps: '', latestResult: null, lastPractisedAt: null, nextReviewAt: null, keyPoints: [],
});

beforeEach(() => {
  Object.values({ updateDomainStateField, deleteDomainStateField, saveAnswer, createUserEntity, updateUserEntityFields, deleteUserEntity, saveDailyLog })
    .forEach((fn) => fn.mockReset().mockResolvedValue(undefined));
});

describe('syncActionToFirestore', () => {
  it('UPSERT ddiaChapters writes only the patched fields via dot-path (no whole-document overwrite)', () => {
    syncActionToFirestore('u1', baseState(), { type: 'UPSERT', payload: { collection: 'ddiaChapters', item: { id: 'CHAPTER_3', status: 'DONE' } } });
    expect(updateDomainStateField).toHaveBeenCalledWith('u1', 'ddia', 'chapters.CHAPTER_3.status', 'DONE');
  });

  it('UPSERT learningItems (new custom question) writes a dot-path entry into the right domainState doc', () => {
    syncActionToFirestore('u1', baseState(), {
      type: 'UPSERT',
      payload: { collection: 'learningItems', item: { id: 'c1', domain: 'BEHAVIOUR', track: 'BEHAVIOUR', title: 'Q', question: 'Q', category: 'General', latestResult: null, lastPractisedAt: null, nextReviewAt: null } },
    });
    expect(updateDomainStateField).toHaveBeenCalledWith('u1', 'behaviour', 'c1', expect.objectContaining({ custom: { title: 'Q', question: 'Q', category: 'General' } }));
  });

  it('UPSERT priorities creates a new entity when the id does not exist yet', () => {
    syncActionToFirestore('u1', baseState({ priorities: [] }), { type: 'UPSERT', payload: { collection: 'priorities', item: { id: 'p1', title: 'x' } } });
    expect(createUserEntity).toHaveBeenCalledWith('u1', 'priorities', { id: 'p1', title: 'x' });
    expect(updateUserEntityFields).not.toHaveBeenCalled();
  });

  it('UPSERT priorities merges only the patch fields for an existing entity (does not clobber a concurrent field edit)', () => {
    const state = baseState({ priorities: [{ id: 'p1', title: 'old', dueDate: 'd', priority: 'HIGH', completed: false, order: 0, source: 'MANUAL' }] });
    syncActionToFirestore('u1', state, { type: 'UPSERT', payload: { collection: 'priorities', item: { id: 'p1', completed: true } } });
    expect(updateUserEntityFields).toHaveBeenCalledWith('u1', 'priorities', 'p1', { completed: true });
    expect(createUserEntity).not.toHaveBeenCalled();
  });

  it('UPSERT systemDesignTasks with a partial patch never re-sends the whole task document', () => {
    const state = baseState({ systemDesignTasks: [{ id: 't1', title: 'Bitly', category: 'c', status: 'NOT_STARTED', attempts: [], notes: 'old notes', scaling: 'old scaling' } as any] });
    syncActionToFirestore('u1', state, { type: 'UPSERT', payload: { collection: 'systemDesignTasks', item: { id: 't1', notes: 'new notes' } } });
    expect(updateUserEntityFields).toHaveBeenCalledWith('u1', 'systemDesignTasks', 't1', { notes: 'new notes' });
  });

  it('DELETE on an entity collection deletes that one document', () => {
    syncActionToFirestore('u1', baseState(), { type: 'DELETE', payload: { collection: 'priorities', id: 'p1' } });
    expect(deleteUserEntity).toHaveBeenCalledWith('u1', 'priorities', 'p1');
  });

  it('DELETE learningItems removes the dot-path field for that item only', () => {
    const state = baseState({ learningItems: [learningItem('c1', 'BEHAVIOUR', 'BEHAVIOUR')] });
    syncActionToFirestore('u1', state, { type: 'DELETE', payload: { collection: 'learningItems', id: 'c1' } });
    expect(deleteDomainStateField).toHaveBeenCalledWith('u1', 'behaviour', 'c1');
  });

  it('DISMISS_AUTO appends to the existing dismissed list rather than replacing unrelated dashboard state', () => {
    syncActionToFirestore('u1', baseState({ dismissedAutomaticPriorities: ['a'] }), { type: 'DISMISS_AUTO', payload: 'b' });
    expect(updateDomainStateField).toHaveBeenCalledWith('u1', 'dashboard', 'dismissedAutomaticPriorities', ['a', 'b']);
  });

  it('PRIORITY_REORDER only updates the order of the two swapped priorities', () => {
    const state = baseState({ priorities: [{ id: 'p1', order: 0 } as any, { id: 'p2', order: 1 } as any, { id: 'p3', order: 2 } as any] });
    syncActionToFirestore('u1', state, { type: 'PRIORITY_REORDER', payload: { id: 'p2', direction: -1 } });
    expect(updateUserEntityFields).toHaveBeenCalledWith('u1', 'priorities', 'p2', { order: 0 });
    expect(updateUserEntityFields).toHaveBeenCalledWith('u1', 'priorities', 'p1', { order: 1 });
    expect(updateUserEntityFields).toHaveBeenCalledTimes(2);
  });

  it('LEARNING_UPDATE routes latestResult/dates to domainState and personalAnswer/notes to the answers doc separately', () => {
    const state = baseState({ learningItems: [learningItem('java-core-1', 'JAVA_THEORY', 'CORE_JAVA')] });
    syncActionToFirestore('u1', state, { type: 'LEARNING_UPDATE', payload: { id: 'java-core-1', latestResult: 'PASS', lastPractisedAt: '2026-08-08', personalAnswer: 'my answer' } });
    expect(updateDomainStateField).toHaveBeenCalledWith('u1', 'javaCore', 'java-core-1.latestResult', 'PASS');
    expect(updateDomainStateField).toHaveBeenCalledWith('u1', 'javaCore', 'java-core-1.lastPractisedAt', '2026-08-08');
    expect(saveAnswer).toHaveBeenCalledWith('u1', 'java-core-1', { personalAnswer: 'my answer' });
  });

  it('LEARNING_UPDATE for a DDIA sub-question uses the nested questions.* dot-path', () => {
    const state = baseState({ learningItems: [learningItem('ddia-1-q1', 'DDIA', 'CHAPTER_1')] });
    syncActionToFirestore('u1', state, { type: 'LEARNING_UPDATE', payload: { id: 'ddia-1-q1', latestResult: 'PASS' } });
    expect(updateDomainStateField).toHaveBeenCalledWith('u1', 'ddia', 'questions.ddia-1-q1.latestResult', 'PASS');
  });

  it('LEARNING_UPDATE with a title/modelAnswer override writes it under custom.* without touching latestResult', () => {
    const state = baseState({ learningItems: [learningItem('java-core-1', 'JAVA_THEORY', 'CORE_JAVA')] });
    syncActionToFirestore('u1', state, { type: 'LEARNING_UPDATE', payload: { id: 'java-core-1', modelAnswer: 'My own answer' } });
    expect(updateDomainStateField).toHaveBeenCalledWith('u1', 'javaCore', 'java-core-1.custom.modelAnswer', 'My own answer');
  });

  it('DSA_UPDATE writes firstSolvedAt as its own dot-path field', () => {
    syncActionToFirestore('u1', baseState(), { type: 'DSA_UPDATE', payload: { id: 'dsa-1', firstSolvedAt: '2026-08-08' } });
    expect(updateDomainStateField).toHaveBeenCalledWith('u1', 'dsa', 'dsa-1.firstSolvedAt', '2026-08-08');
  });

  it('DSA_UPDATE strips free-text review notes before writing reviews to the lightweight domainState doc', () => {
    syncActionToFirestore('u1', baseState(), {
      type: 'DSA_UPDATE',
      payload: { id: 'dsa-1', reviews: [{ id: 'r1', stage: 'D1', dueAt: '2026-08-09', completed: true, completedAt: '2026-08-08', note: 'long review note text' }] },
    });
    expect(updateDomainStateField).toHaveBeenCalledWith('u1', 'dsa', 'dsa-1.reviews', [{ id: 'r1', stage: 'D1', dueAt: '2026-08-09', completed: true, completedAt: '2026-08-08' }]);
  });

  it('DAILY_LOG_SAVE saves to the date-keyed dailyLogs doc', () => {
    syncActionToFirestore('u1', baseState(), { type: 'DAILY_LOG_SAVE', payload: { id: 'daily-log-2026-08-08', date: '2026-08-08', note: 'felt clear' } });
    expect(saveDailyLog).toHaveBeenCalledWith('u1', '2026-08-08', 'felt clear');
  });

  it('REPLACE performs no Firestore writes (handled by dedicated reset/import flows)', () => {
    syncActionToFirestore('u1', baseState(), { type: 'REPLACE', payload: baseState() });
    expect(updateDomainStateField).not.toHaveBeenCalled();
    expect(createUserEntity).not.toHaveBeenCalled();
  });
});
