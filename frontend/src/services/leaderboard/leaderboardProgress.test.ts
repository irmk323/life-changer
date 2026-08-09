import { describe, expect, it } from 'vitest';
import type { AppState, ChapterStatus, DsaProblem, Task } from '../../types/appState';
import { progress } from '../readiness/calculations';
import { calculateLeaderboardProgress } from './leaderboardProgress';

const dsaProblem = (id: string, firstSolvedAt: string | null): DsaProblem => ({
  id, title: id, category: 'Arrays', difficulty: 'MEDIUM', leetcodeUrl: null,
  firstSolvedAt, initialNotes: '', generalNotes: '', reviews: [],
});

const chapter = (id: string, status: ChapterStatus['status']): ChapterStatus => ({ id, status, notes: '' });

const task = (id: string, status: Task['status'], source?: Task['source']): Task => ({ id, title: id, category: 'System design', status, attempts: [], ...(source ? { source } : {}) });

const baseState = (overrides: Partial<AppState> = {}): AppState => ({
  version: 1, motivationEntries: [], learningItems: [], attempts: [], reviews: [],
  dsa: [], dailyLogs: [], weeklyPlanItems: [], activities: [], priorities: [],
  dismissedAutomaticPriorities: [], functionalTasks: [], systemDesignTasks: [], ddiaChapters: [],
  ...overrides,
});

describe('calculateLeaderboardProgress', () => {
  it('counts DSA problems with a firstSolvedAt as completed, out of every built-in problem', () => {
    const state = baseState({ dsa: [dsaProblem('a', '2026-01-01'), dsaProblem('b', null), dsaProblem('c', '2026-01-02'), dsaProblem('d', null)] });
    expect(calculateLeaderboardProgress(state).dsa).toEqual({ completed: 2, total: 4, percentage: 50 });
  });

  it('agrees with the existing DSA progress() calculation used on the dashboard', () => {
    const dsa = [dsaProblem('a', '2026-01-01'), dsaProblem('b', null), dsaProblem('c', null)];
    const state = baseState({ dsa });
    const expected = progress(dsa, true);
    expect(calculateLeaderboardProgress(state).dsa).toEqual({ completed: expected.done, total: expected.total, percentage: expected.percentage });
  });

  it('counts DDIA chapters marked DONE against the fixed 12-chapter curriculum', () => {
    const state = baseState({ ddiaChapters: [chapter('CHAPTER_1', 'DONE'), chapter('CHAPTER_2', 'IN_PROGRESS'), chapter('CHAPTER_3', 'DONE')] });
    const result = calculateLeaderboardProgress(state).ddia;
    expect(result.total).toBe(12);
    expect(result.completed).toBe(2);
    expect(result.percentage).toBe(17);
  });

  it('ignores ddiaChapters entries whose id is outside the known chapter range', () => {
    const state = baseState({ ddiaChapters: [chapter('CHAPTER_1', 'DONE'), chapter('CHAPTER_99', 'DONE')] });
    expect(calculateLeaderboardProgress(state).ddia.completed).toBe(1);
  });

  it('counts Hello Interview tasks with status INTERVIEW_READY, out of every task currently in state', () => {
    const state = baseState({ systemDesignTasks: [task('t1', 'INTERVIEW_READY'), task('t2', 'IN_PROGRESS'), task('t3', 'INTERVIEW_READY'), task('t4', 'NOT_STARTED')] });
    expect(calculateLeaderboardProgress(state).helloInterview).toEqual({ completed: 2, total: 4, percentage: 50 });
  });

  it('excludes CUSTOM Hello Interview tasks from both the numerator and the denominator', () => {
    const state = baseState({
      systemDesignTasks: [
        task('t1', 'INTERVIEW_READY', 'BUILT_IN'),
        task('t2', 'NOT_STARTED', 'BUILT_IN'),
        task('t3', 'INTERVIEW_READY', 'CUSTOM'),
      ],
    });
    expect(calculateLeaderboardProgress(state).helloInterview).toEqual({ completed: 1, total: 2, percentage: 50 });
  });

  it('treats a task with no source field as built-in (backward compatibility with pre-2G data)', () => {
    const state = baseState({ systemDesignTasks: [task('t1', 'INTERVIEW_READY')] });
    expect(calculateLeaderboardProgress(state).helloInterview.total).toBe(1);
  });

  it('returns 0 percentage instead of NaN when a domain has no items', () => {
    const result = calculateLeaderboardProgress(baseState());
    expect(result).toEqual({
      dsa: { completed: 0, total: 0, percentage: 0 },
      ddia: { completed: 0, total: 12, percentage: 0 },
      helloInterview: { completed: 0, total: 0, percentage: 0 },
    });
  });
});
