import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadInitialAppState } from './loadInitialAppState';

const { getDomainState } = vi.hoisted(() => ({ getDomainState: vi.fn() }));
vi.mock('../services/firebase/userDataRepository', () => ({ getDomainState }));

const { listUserEntities, createUserEntity } = vi.hoisted(() => ({
  listUserEntities: vi.fn(),
  createUserEntity: vi.fn(),
}));
vi.mock('../services/firebase/userEntityRepository', () => ({ listUserEntities, createUserEntity }));

beforeEach(() => {
  getDomainState.mockReset().mockResolvedValue({});
  listUserEntities.mockReset().mockResolvedValue([]);
  createUserEntity.mockReset().mockResolvedValue(undefined);
});

describe('loadInitialAppState', () => {
  it('seeds the built-in Hello Interview task list (source: BUILT_IN) for a brand-new user', async () => {
    const state = await loadInitialAppState('u1');
    expect(state.systemDesignTasks.length).toBeGreaterThan(0);
    expect(state.systemDesignTasks.every((t) => t.source === 'BUILT_IN')).toBe(true);
    expect(createUserEntity).toHaveBeenCalledWith('u1', 'systemDesignTasks', expect.objectContaining({ source: 'BUILT_IN' }));
  });

  it('seeds starter Functional Coding tasks for a brand-new user', async () => {
    const state = await loadInitialAppState('u1');
    expect(state.functionalTasks.length).toBeGreaterThan(0);
    expect(createUserEntity).toHaveBeenCalledWith('u1', 'functionalTasks', expect.objectContaining({ status: 'NOT_STARTED' }));
  });

  it('does not re-seed when the user already has systemDesignTasks/functionalTasks (idempotent)', async () => {
    listUserEntities.mockImplementation((_uid: string, name: string) => {
      if (name === 'systemDesignTasks') return Promise.resolve([{ id: 'design-1', title: 'Bitly', status: 'DONE', source: 'BUILT_IN', attempts: [] }]);
      if (name === 'functionalTasks') return Promise.resolve([{ id: 'functional-1', title: 'Booking API', status: 'DONE', attempts: [] }]);
      return Promise.resolve([]);
    });
    const state = await loadInitialAppState('u1');
    expect(state.systemDesignTasks).toEqual([{ id: 'design-1', title: 'Bitly', status: 'DONE', source: 'BUILT_IN', attempts: [] }]);
    expect(createUserEntity).not.toHaveBeenCalled();
  });

  it('assembles the built-in DSA/DDIA/learningItems from static data, defaulting to empty state for a fresh user', async () => {
    const state = await loadInitialAppState('u1');
    expect(state.dsa).toHaveLength(150);
    expect(state.ddiaChapters).toHaveLength(12);
    expect(state.learningItems.length).toBeGreaterThan(0);
    expect(state.dsa.every((p) => p.firstSolvedAt === null)).toBe(true);
  });

  it('does not eagerly load dailyLogs (lazy per-day loaded by CalendarPage instead)', async () => {
    const state = await loadInitialAppState('u1');
    expect(state.dailyLogs).toEqual([]);
  });

  it('passes through saved domainState overlays into the assembled dsa/ddia/learningItems', async () => {
    getDomainState.mockImplementation((_uid: string, name: string) => {
      if (name === 'dsa') return Promise.resolve({ 'dsa-1': { firstSolvedAt: '2026-08-01', reviews: [] } });
      if (name === 'ddia') return Promise.resolve({ chapters: { CHAPTER_1: { status: 'DONE', notes: 'n' } }, questions: {} });
      return Promise.resolve({});
    });
    const state = await loadInitialAppState('u1');
    expect(state.dsa.find((p) => p.id === 'dsa-1')?.firstSolvedAt).toBe('2026-08-01');
    expect(state.ddiaChapters.find((c) => c.id === 'CHAPTER_1')?.status).toBe('DONE');
  });

  it('loads priorities/activities/motivationEntries/weeklyPlanItems entity lists as-is', async () => {
    listUserEntities.mockImplementation((_uid: string, name: string) => {
      if (name === 'priorities') return Promise.resolve([{ id: 'p1' }]);
      if (name === 'activities') return Promise.resolve([{ id: 'a1' }]);
      if (name === 'motivationEntries') return Promise.resolve([{ id: 'm1' }]);
      if (name === 'weeklyPlanItems') return Promise.resolve([{ id: 'w1' }]);
      return Promise.resolve([]);
    });
    const state = await loadInitialAppState('u1');
    expect(state.priorities).toEqual([{ id: 'p1' }]);
    expect(state.activities).toEqual([{ id: 'a1' }]);
    expect(state.motivationEntries).toEqual([{ id: 'm1' }]);
    expect(state.weeklyPlanItems).toEqual([{ id: 'w1' }]);
  });
});
