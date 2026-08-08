import { describe, expect, it } from 'vitest';
import type { AppState, TaskStatus } from '../../types/appState';
import { detectLeaderboardActivity } from './detectLeaderboardActivity';

const baseState = (overrides: Partial<AppState> = {}): AppState => ({
  version: 1, motivationEntries: [], learningItems: [], attempts: [], reviews: [],
  dsa: [], dailyLogs: [], weeklyPlanItems: [], activities: [], priorities: [],
  dismissedAutomaticPriorities: [], functionalTasks: [], systemDesignTasks: [], ddiaChapters: [],
  ...overrides,
});

const dsaProblem = (id: string, firstSolvedAt: string | null) => ({
  id, title: id === 'two-sum' ? 'Two Sum' : id, category: 'Arrays', difficulty: 'MEDIUM', leetcodeUrl: null,
  firstSolvedAt, initialNotes: 'secret notes', generalNotes: 'more secret notes', reviews: [],
});

const chapter = (id: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE') => ({ id, status, notes: 'secret notes' });

const task = (id: string, status: TaskStatus, title = id) => ({ id, title, category: 'System design', status, attempts: [], notes: 'secret notes' });

const OCCURRED_AT = '2026-08-08T00:00:00.000Z';

describe('detectLeaderboardActivity', () => {
  it('produces no events when there is nothing to diff against (previous is null)', () => {
    const next = baseState({ dsa: [dsaProblem('two-sum', '2026-08-01')] });
    expect(detectLeaderboardActivity(null, next, OCCURRED_AT)).toEqual([]);
  });

  it('emits a DSA event when a problem transitions from unsolved to solved', () => {
    const previous = baseState({ dsa: [dsaProblem('two-sum', null)] });
    const next = baseState({ dsa: [dsaProblem('two-sum', '2026-08-08')] });
    expect(detectLeaderboardActivity(previous, next, OCCURRED_AT)).toEqual([
      { domain: 'DSA', label: 'Two Sum', occurredAt: OCCURRED_AT },
    ]);
  });

  it('does not re-emit a DSA event when the problem was already solved', () => {
    const previous = baseState({ dsa: [dsaProblem('two-sum', '2026-08-01')] });
    const next = baseState({ dsa: [dsaProblem('two-sum', '2026-08-01')] });
    expect(detectLeaderboardActivity(previous, next, OCCURRED_AT)).toEqual([]);
  });

  it('emits a DDIA event with a "DDIA Chapter N" label when a chapter transitions to DONE', () => {
    const previous = baseState({ ddiaChapters: [chapter('CHAPTER_7', 'IN_PROGRESS')] });
    const next = baseState({ ddiaChapters: [chapter('CHAPTER_7', 'DONE')] });
    expect(detectLeaderboardActivity(previous, next, OCCURRED_AT)).toEqual([
      { domain: 'DDIA', label: 'DDIA Chapter 7', occurredAt: OCCURRED_AT },
    ]);
  });

  it('does not emit a DDIA event when a chapter is un-marked as DONE', () => {
    const previous = baseState({ ddiaChapters: [chapter('CHAPTER_7', 'DONE')] });
    const next = baseState({ ddiaChapters: [chapter('CHAPTER_7', 'IN_PROGRESS')] });
    expect(detectLeaderboardActivity(previous, next, OCCURRED_AT)).toEqual([]);
  });

  it('emits a Hello Interview event when a task transitions to INTERVIEW_READY', () => {
    const previous = baseState({ systemDesignTasks: [task('design-1', 'IN_PROGRESS', 'Bitly')] });
    const next = baseState({ systemDesignTasks: [task('design-1', 'INTERVIEW_READY', 'Bitly')] });
    expect(detectLeaderboardActivity(previous, next, OCCURRED_AT)).toEqual([
      { domain: 'HELLO_INTERVIEW', label: 'Bitly', occurredAt: OCCURRED_AT },
    ]);
  });

  it('emits multiple events at once when several domains progress in the same update', () => {
    const previous = baseState({ dsa: [dsaProblem('two-sum', null)], ddiaChapters: [chapter('CHAPTER_1', 'NOT_STARTED')] });
    const next = baseState({ dsa: [dsaProblem('two-sum', '2026-08-08')], ddiaChapters: [chapter('CHAPTER_1', 'DONE')] });
    expect(detectLeaderboardActivity(previous, next, OCCURRED_AT)).toHaveLength(2);
  });

  it('never includes free-text fields (notes, initialNotes, generalNotes) in the emitted events', () => {
    const previous = baseState({ dsa: [dsaProblem('two-sum', null)] });
    const next = baseState({ dsa: [dsaProblem('two-sum', '2026-08-08')] });
    const events = detectLeaderboardActivity(previous, next, OCCURRED_AT);
    events.forEach((event) => {
      expect(Object.keys(event).sort()).toEqual(['domain', 'label', 'occurredAt']);
    });
  });
});
