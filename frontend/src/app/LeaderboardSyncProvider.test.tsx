// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppState } from '../types/appState';
import { LeaderboardSyncProvider, SYNC_DEBOUNCE_MS, shouldSync } from './LeaderboardSyncProvider';

const { syncLeaderboardProgress } = vi.hoisted(() => ({ syncLeaderboardProgress: vi.fn() }));
vi.mock('../services/firebase/leaderboardProgressRepository', () => ({ syncLeaderboardProgress }));

const { postLeaderboardActivity } = vi.hoisted(() => ({ postLeaderboardActivity: vi.fn() }));
vi.mock('../services/firebase/leaderboardActivityRepository', () => ({ postLeaderboardActivity }));

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('./AuthProvider', () => ({ useAuth }));

const { useAppState } = vi.hoisted(() => ({ useAppState: vi.fn() }));
vi.mock('./AppStateProvider', () => ({ useAppState }));

const baseState = (overrides: Partial<AppState> = {}): AppState => ({
  version: 1, motivationEntries: [], learningItems: [], attempts: [], reviews: [],
  dsa: [], dailyLogs: [], weeklyPlanItems: [], activities: [], priorities: [],
  dismissedAutomaticPriorities: [], functionalTasks: [], systemDesignTasks: [], ddiaChapters: [],
  ...overrides,
});

describe('shouldSync', () => {
  const progress = { dsa: { completed: 1, total: 150, percentage: 1 }, ddia: { completed: 0, total: 12, percentage: 0 }, helloInterview: { completed: 0, total: 0, percentage: 0 } };

  it('reports dirty on the first call (no previous value)', () => {
    expect(shouldSync(null, progress).shouldSync).toBe(true);
  });

  it('reports not dirty when the serialized value is unchanged', () => {
    const { serialized } = shouldSync(null, progress);
    expect(shouldSync(serialized, progress).shouldSync).toBe(false);
  });

  it('reports dirty when the value actually changed', () => {
    const { serialized } = shouldSync(null, progress);
    expect(shouldSync(serialized, { ...progress, dsa: { ...progress.dsa, completed: 2 } }).shouldSync).toBe(true);
  });
});

describe('LeaderboardSyncProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    syncLeaderboardProgress.mockReset().mockResolvedValue(undefined);
    postLeaderboardActivity.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('never writes to Firestore while signed out, even after the debounce window passes', () => {
    useAuth.mockReturnValue({ user: null });
    useAppState.mockReturnValue({ state: baseState() });
    render(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);
    vi.advanceTimersByTime(SYNC_DEBOUNCE_MS + 1000);
    expect(syncLeaderboardProgress).not.toHaveBeenCalled();
  });

  it('debounces: does not sync immediately, syncs once after the debounce window', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1' } });
    useAppState.mockReturnValue({ state: baseState({ dsa: [{ id: 'd1', title: 'x', category: 'c', difficulty: 'EASY', leetcodeUrl: null, firstSolvedAt: '2026-08-01', initialNotes: '', generalNotes: '', reviews: [] }] }) });
    render(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);

    expect(syncLeaderboardProgress).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS - 100);
    expect(syncLeaderboardProgress).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(syncLeaderboardProgress).toHaveBeenCalledTimes(1);
    expect(syncLeaderboardProgress.mock.calls[0][0]).toBe('u1');
    expect(syncLeaderboardProgress.mock.calls[0][1].dsa.completed).toBe(1);
  });

  it('resets the debounce timer on rapid successive changes instead of writing for each one', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1' } });
    useAppState.mockReturnValue({ state: baseState({ activities: [] }) });
    const { rerender } = render(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);

    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS - 500);
    useAppState.mockReturnValue({ state: baseState({ dsa: [{ id: 'd1', title: 'x', category: 'c', difficulty: 'EASY', leetcodeUrl: null, firstSolvedAt: '2026-08-01', initialNotes: '', generalNotes: '', reviews: [] }] }) });
    rerender(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);

    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS - 500);
    expect(syncLeaderboardProgress).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(600);
    expect(syncLeaderboardProgress).toHaveBeenCalledTimes(1);
  });

  it('does not write again when a re-render produces the same progress values', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1' } });
    useAppState.mockReturnValue({ state: baseState() });
    const { rerender } = render(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);
    expect(syncLeaderboardProgress).toHaveBeenCalledTimes(1);

    useAppState.mockReturnValue({ state: baseState({ dailyLogs: [{ id: 'log-1', date: '2026-08-08', note: 'unrelated field' }] }) });
    rerender(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS + 1000);
    expect(syncLeaderboardProgress).toHaveBeenCalledTimes(1);
  });

  it('swallows sync failures instead of crashing the app', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    syncLeaderboardProgress.mockRejectedValue(new Error('offline'));
    useAuth.mockReturnValue({ user: { uid: 'u1' } });
    useAppState.mockReturnValue({ state: baseState() });
    render(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not post any activity for pre-existing progress on the first render after sign-in', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1' } });
    useAppState.mockReturnValue({ state: baseState({ dsa: [{ id: 'd1', title: 'x', category: 'c', difficulty: 'EASY', leetcodeUrl: null, firstSolvedAt: '2026-08-01', initialNotes: '', generalNotes: '', reviews: [] }] }) });
    render(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS + 1000);
    expect(postLeaderboardActivity).not.toHaveBeenCalled();
  });

  it('posts an activity immediately (not debounced) when an item newly completes', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1' } });
    useAppState.mockReturnValue({ state: baseState({ dsa: [{ id: 'd1', title: 'Two Sum', category: 'c', difficulty: 'EASY', leetcodeUrl: null, firstSolvedAt: null, initialNotes: '', generalNotes: '', reviews: [] }] }) });
    const { rerender } = render(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);

    useAppState.mockReturnValue({ state: baseState({ dsa: [{ id: 'd1', title: 'Two Sum', category: 'c', difficulty: 'EASY', leetcodeUrl: null, firstSolvedAt: '2026-08-08', initialNotes: '', generalNotes: '', reviews: [] }] }) });
    rerender(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);

    expect(postLeaderboardActivity).toHaveBeenCalledTimes(1);
    expect(postLeaderboardActivity).toHaveBeenCalledWith('u1', { domain: 'DSA', label: 'Two Sum', occurredAt: expect.any(String) });
  });

  it('never posts activity while signed out', async () => {
    useAuth.mockReturnValue({ user: null });
    useAppState.mockReturnValue({ state: baseState({ dsa: [{ id: 'd1', title: 'Two Sum', category: 'c', difficulty: 'EASY', leetcodeUrl: null, firstSolvedAt: '2026-08-08', initialNotes: '', generalNotes: '', reviews: [] }] }) });
    render(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);
    await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS + 1000);
    expect(postLeaderboardActivity).not.toHaveBeenCalled();
  });

  it('swallows activity-post failures instead of crashing the app', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    postLeaderboardActivity.mockRejectedValue(new Error('offline'));
    useAuth.mockReturnValue({ user: { uid: 'u1' } });
    useAppState.mockReturnValue({ state: baseState({ dsa: [{ id: 'd1', title: 'Two Sum', category: 'c', difficulty: 'EASY', leetcodeUrl: null, firstSolvedAt: null, initialNotes: '', generalNotes: '', reviews: [] }] }) });
    const { rerender } = render(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);
    useAppState.mockReturnValue({ state: baseState({ dsa: [{ id: 'd1', title: 'Two Sum', category: 'c', difficulty: 'EASY', leetcodeUrl: null, firstSolvedAt: '2026-08-08', initialNotes: '', generalNotes: '', reviews: [] }] }) });
    rerender(<LeaderboardSyncProvider><span /></LeaderboardSyncProvider>);
    await vi.advanceTimersByTimeAsync(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
