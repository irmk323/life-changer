import { describe, expect, it } from 'vitest';
import {
  assembleCoreAppState,
  assembleDdiaChapters,
  assembleDsa,
  assembleLearningItems,
  emptyRawDomainState,
  learningItemLocation,
  type DomainItemStateMap,
} from './assembleAppState';

describe('assembleLearningItems', () => {
  it('assembles built-in behaviour/java/ddia questions from static JSON with default (untouched) state for a fresh user', () => {
    const items = assembleLearningItems(emptyRawDomainState());
    const behaviourItems = items.filter((i) => i.domain === 'BEHAVIOUR');
    expect(behaviourItems.length).toBeGreaterThan(0);
    expect(behaviourItems[0].latestResult).toBeNull();
    expect(behaviourItems[0].personalAnswer).toBe(''); // lazy-loaded separately, never inline here
    expect(behaviourItems[0].title).not.toBe('');
  });

  it('overlays saved lightweight state (latestResult/dates) onto a built-in item without duplicating its title/question', () => {
    const raw = emptyRawDomainState();
    raw.behaviour = { 'behaviour-1': { latestResult: 'PASS', lastPractisedAt: '2026-08-01', nextReviewAt: '2026-08-18' } };
    const items = assembleLearningItems(raw);
    const item = items.find((i) => i.id === 'behaviour-1')!;
    expect(item.latestResult).toBe('PASS');
    expect(item.lastPractisedAt).toBe('2026-08-01');
  });

  it('includes a user-created custom question (id not in the built-in set) with its full content', () => {
    const raw = emptyRawDomainState();
    raw.behaviour = { 'custom-uuid-1': { latestResult: null, lastPractisedAt: null, nextReviewAt: null, custom: { title: 'My question', question: 'My question', category: 'General' } } };
    const items = assembleLearningItems(raw);
    const custom = items.find((i) => i.id === 'custom-uuid-1');
    expect(custom).toBeDefined();
    expect(custom!.title).toBe('My question');
  });

  it('routes DDIA sub-questions through the nested questions map, using the stored track for custom ones', () => {
    const raw = emptyRawDomainState();
    raw.ddia.questions = { 'custom-ddia-1': { latestResult: null, lastPractisedAt: null, nextReviewAt: null, track: 'CHAPTER_5', custom: { title: 'Extra DDIA question', question: 'Extra DDIA question', category: 'System design' } } };
    const items = assembleLearningItems(raw);
    const custom = items.find((i) => i.id === 'custom-ddia-1');
    expect(custom?.domain).toBe('DDIA');
    expect(custom?.track).toBe('CHAPTER_5');
  });

  it('assembles Hello Interview sub-questions (all custom, no built-in seed) with their stored taskId as track', () => {
    const raw = emptyRawDomainState();
    raw.helloInterview = { q1: { latestResult: null, lastPractisedAt: null, nextReviewAt: null, track: 'design-1', custom: { title: 'Clarify SLAs', question: 'Clarify SLAs', category: 'System design' } } };
    const items = assembleLearningItems(raw);
    const item = items.find((i) => i.id === 'q1');
    expect(item?.domain).toBe('SYSTEM_DESIGN');
    expect(item?.track).toBe('design-1');
  });

  it('overrides a built-in item title/modelAnswer when the user has edited it via "Edit question"', () => {
    const raw = emptyRawDomainState();
    raw.javaCore = { 'java-core-1': { latestResult: null, lastPractisedAt: null, nextReviewAt: null, custom: { title: 'Rewritten prompt', question: 'Rewritten prompt', category: 'equals and hashCode', modelAnswer: 'My own answer' } } };
    const items = assembleLearningItems(raw);
    const item = items.find((i) => i.id === 'java-core-1')!;
    expect(item.title).toBe('Rewritten prompt');
    expect(item.modelAnswer).toBe('My own answer');
  });
});

describe('assembleDsa', () => {
  it('produces all 150 built-in DSA problems with default (unsolved) state for a fresh user', () => {
    const problems = assembleDsa({});
    expect(problems).toHaveLength(150);
    expect(problems.every((p) => p.firstSolvedAt === null && p.reviews.length === 0)).toBe(true);
    expect(problems.every((p) => p.initialNotes === '' && p.generalNotes === '')).toBe(true);
  });

  it('overlays firstSolvedAt/reviews without needing notes to be present', () => {
    const problems = assembleDsa({ 'dsa-1': { firstSolvedAt: '2026-08-01', reviews: [{ id: 'r', stage: 'D1', dueAt: '2026-08-02', completed: true, completedAt: '2026-08-02', note: '' }] } });
    expect(problems[0].firstSolvedAt).toBe('2026-08-01');
    expect(problems[0].reviews).toHaveLength(1);
  });
});

describe('assembleDdiaChapters', () => {
  it('produces all 12 built-in chapters, defaulting to NOT_STARTED for a fresh user', () => {
    const chapters = assembleDdiaChapters({});
    expect(chapters).toHaveLength(12);
    expect(chapters.every((c) => c.status === 'NOT_STARTED' && c.notes === '')).toBe(true);
  });

  it('overlays saved status/notes for touched chapters only', () => {
    const chapters = assembleDdiaChapters({ CHAPTER_3: { status: 'DONE', notes: 'Key takeaway' } });
    expect(chapters.find((c) => c.id === 'CHAPTER_3')).toEqual({ id: 'CHAPTER_3', status: 'DONE', notes: 'Key takeaway' });
    expect(chapters.find((c) => c.id === 'CHAPTER_1')?.status).toBe('NOT_STARTED');
  });
});

describe('assembleCoreAppState', () => {
  it('combines learningItems/dsa/ddiaChapters/dismissedAutomaticPriorities from raw domainState', () => {
    const raw = emptyRawDomainState();
    raw.dashboard.dismissedAutomaticPriorities = ['p1'];
    const core = assembleCoreAppState(raw);
    expect(core.dismissedAutomaticPriorities).toEqual(['p1']);
    expect(core.dsa).toHaveLength(150);
    expect(core.ddiaChapters).toHaveLength(12);
    expect(core.learningItems.length).toBeGreaterThan(0);
  });
});

describe('learningItemLocation', () => {
  it('routes BEHAVIOUR to the behaviour domainState doc with no path prefix', () => {
    expect(learningItemLocation('BEHAVIOUR', 'BEHAVIOUR')).toEqual({ doc: 'behaviour', pathPrefix: '' });
  });

  it('routes JAVA_THEORY by track to javaCore or javaSpring', () => {
    expect(learningItemLocation('JAVA_THEORY', 'CORE_JAVA').doc).toBe('javaCore');
    expect(learningItemLocation('JAVA_THEORY', 'SPRING_BOOT').doc).toBe('javaSpring');
  });

  it('routes DDIA sub-questions into the nested questions. prefix of the ddia doc', () => {
    expect(learningItemLocation('DDIA', 'CHAPTER_1')).toEqual({ doc: 'ddia', pathPrefix: 'questions.' });
  });

  it('routes SYSTEM_DESIGN sub-questions to the helloInterview doc', () => {
    expect(learningItemLocation('SYSTEM_DESIGN', 'design-1')).toEqual({ doc: 'helloInterview', pathPrefix: '' });
  });
});

describe('type sanity (DomainItemStateMap)', () => {
  it('accepts a map without a track for non-shared docs', () => {
    const map: DomainItemStateMap = { a: { latestResult: null, lastPractisedAt: null, nextReviewAt: null } };
    expect(Object.keys(map)).toEqual(['a']);
  });
});
