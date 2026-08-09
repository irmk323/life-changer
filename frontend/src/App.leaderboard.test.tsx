// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from './services/firebase/auth';
import { AppStateProvider } from './app/AppStateProvider';
import { AuthProvider } from './app/AuthProvider';
import { AppAuthGate } from './app/AppAuthGate';
import App from './App';

const { subscribeToAuthState, signInWithGoogle, signOutUser } = vi.hoisted(() => ({
  subscribeToAuthState: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
}));

vi.mock('./services/firebase/auth', () => ({ subscribeToAuthState, signInWithGoogle, signOutUser }));

const { getProfile, createProfile, updateProfile, subscribeAllProfiles } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  subscribeAllProfiles: vi.fn(),
}));

vi.mock('./services/firebase/profile', () => ({ getProfile, createProfile, updateProfile, subscribeAllProfiles }));

const { subscribeAllProgress } = vi.hoisted(() => ({ subscribeAllProgress: vi.fn() }));
vi.mock('./services/firebase/leaderboardProgressRepository', () => ({ subscribeAllProgress }));

const { subscribeRecentActivities } = vi.hoisted(() => ({ subscribeRecentActivities: vi.fn() }));
vi.mock('./services/firebase/leaderboardActivityRepository', () => ({ subscribeRecentActivities }));

// Personal-data Firestore repositories used by AppStateProvider's loadInitialAppState.
// Resolved empty so every page other than Leaderboard just renders a fresh/empty state.
const { getDomainState } = vi.hoisted(() => ({ getDomainState: vi.fn() }));
vi.mock('./services/firebase/userDataRepository', () => ({ getDomainState }));

const { listUserEntities, createUserEntity, updateUserEntityFields, deleteUserEntity, getDailyLog, saveDailyLog, listWeeklyPlanItemsForRange } = vi.hoisted(() => ({
  listUserEntities: vi.fn(),
  createUserEntity: vi.fn(),
  updateUserEntityFields: vi.fn(),
  deleteUserEntity: vi.fn(),
  getDailyLog: vi.fn(),
  saveDailyLog: vi.fn(),
  listWeeklyPlanItemsForRange: vi.fn(),
}));
vi.mock('./services/firebase/userEntityRepository', () => ({
  listUserEntities, createUserEntity, updateUserEntityFields, deleteUserEntity, getDailyLog, saveDailyLog, listWeeklyPlanItemsForRange,
}));

const fakeUser = { uid: 'user-1', displayName: 'Maki' } as User;
const fakeProfile = { uid: 'user-1', displayName: 'Maki', createdAt: 'a', updatedAt: 'a' };
const fakeProgress = { uid: 'user-1', dsa: { completed: 1, total: 150, percentage: 1 }, ddia: { completed: 1, total: 12, percentage: 8 }, helloInterview: { completed: 0, total: 31, percentage: 0 }, updatedAt: 'a' };

const renderApp = () => render(
  <AuthProvider>
    <AppAuthGate>
      <AppStateProvider><App /></AppStateProvider>
    </AppAuthGate>
  </AuthProvider>,
);

describe('Leaderboard sign-in gating', () => {
  let authStateCallback: (user: User | null) => void;

  beforeEach(() => {
    window.location.hash = '#/leaderboard';
    localStorage.clear();
    subscribeToAuthState.mockReset().mockImplementation((cb: (user: User | null) => void) => {
      authStateCallback = cb;
      return () => {};
    });
    getProfile.mockReset().mockResolvedValue(fakeProfile);
    createProfile.mockReset();
    updateProfile.mockReset();
    subscribeAllProfiles.mockReset().mockImplementation((cb: (all: unknown[]) => void) => { cb([fakeProfile]); return () => {}; });
    subscribeAllProgress.mockReset().mockImplementation((cb: (all: unknown[]) => void) => { cb([fakeProgress]); return () => {}; });
    subscribeRecentActivities.mockReset().mockImplementation((_limit: number, cb: (all: unknown[]) => void) => { cb([]); return () => {}; });
    getDomainState.mockReset().mockResolvedValue({});
    listUserEntities.mockReset().mockResolvedValue([]);
    createUserEntity.mockReset().mockResolvedValue(undefined);
    updateUserEntityFields.mockReset().mockResolvedValue(undefined);
    deleteUserEntity.mockReset().mockResolvedValue(undefined);
    getDailyLog.mockReset().mockResolvedValue(null);
    saveDailyLog.mockReset().mockResolvedValue(undefined);
    listWeeklyPlanItemsForRange.mockReset().mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('shows the Login screen when signed out, and the real leaderboard once signed in', async () => {
    renderApp();
    authStateCallback(null);
    await waitFor(() => expect(screen.getByText('Continue with Google')).toBeInTheDocument());
    expect(screen.queryByText('Full ranking')).not.toBeInTheDocument();

    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('Full ranking')).toBeInTheDocument());
  });

  it('requires sign-in for other pages too (e.g. Dashboard) — no localStorage fallback', async () => {
    window.location.hash = '#/dashboard';
    renderApp();
    authStateCallback(null);
    await waitFor(() => expect(screen.getByText('Continue with Google')).toBeInTheDocument());
    expect(screen.queryByText('Your daily command center to prepare for your next role.')).not.toBeInTheDocument();

    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('Your daily command center to prepare for your next role.')).toBeInTheDocument());
  });

  it('ranks multiple users by percentage and marks the current user with "You"', async () => {
    const profiles = [fakeProfile, { uid: 'user-2', displayName: 'Alex', createdAt: 'a', updatedAt: 'a' }];
    const progresses = [
      { uid: 'user-1', dsa: { completed: 1, total: 150, percentage: 1 }, ddia: { completed: 3, total: 12, percentage: 25 }, helloInterview: { completed: 0, total: 31, percentage: 0 }, updatedAt: 'a' },
      { uid: 'user-2', dsa: { completed: 1, total: 150, percentage: 1 }, ddia: { completed: 9, total: 12, percentage: 75 }, helloInterview: { completed: 0, total: 31, percentage: 0 }, updatedAt: 'a' },
    ];
    subscribeAllProfiles.mockReset().mockImplementation((cb: (all: unknown[]) => void) => { cb(profiles); return () => {}; });
    subscribeAllProgress.mockReset().mockImplementation((cb: (all: unknown[]) => void) => { cb(progresses); return () => {}; });

    renderApp();
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('Full ranking')).toBeInTheDocument());

    const rows = document.querySelectorAll('.leaderboard-ranking-row');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Alex');
    expect(rows[0].textContent).toContain('75%');
    expect(rows[1].textContent).toContain('Maki');
    expect(rows[1].textContent).toContain('You');
    expect(rows[1].textContent).toContain('25%');
  });

  it('shows an empty-state message instead of an empty table when nobody has synced progress yet', async () => {
    subscribeAllProgress.mockReset().mockImplementation((cb: (all: unknown[]) => void) => { cb([]); return () => {}; });
    renderApp();
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('No one has synced progress yet. Complete some tasks to appear here!')).toBeInTheDocument());
    expect(screen.queryByText('Full ranking')).not.toBeInTheDocument();
  });

  it('shows a loading state before the Firestore subscriptions report back', async () => {
    subscribeAllProgress.mockReset().mockImplementation(() => () => {});
    subscribeAllProfiles.mockReset().mockImplementation(() => () => {});
    renderApp();
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('Loading leaderboard…')).toBeInTheDocument());
    expect(screen.queryByText('Full ranking')).not.toBeInTheDocument();
  });

  it('renders recent activities from Firestore, newest first, with a "You" tag for the current user', async () => {
    const now = new Date();
    const today = now.toISOString();
    const yesterday = new Date(now.getTime() - 86400000 - 1000).toISOString();
    const activities = [
      { uid: 'user-1', domain: 'DDIA', label: 'DDIA Chapter 7', occurredAt: today },
      { uid: 'user-2', domain: 'DSA', label: 'Two Sum', occurredAt: yesterday },
    ];
    const profiles = [fakeProfile, { uid: 'user-2', displayName: 'Alex', createdAt: 'a', updatedAt: 'a' }];
    subscribeAllProfiles.mockReset().mockImplementation((cb: (all: unknown[]) => void) => { cb(profiles); return () => {}; });
    subscribeRecentActivities.mockReset().mockImplementation((_limit: number, cb: (all: unknown[]) => void) => { cb(activities); return () => {}; });

    renderApp();
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('DDIA Chapter 7')).toBeInTheDocument());

    const rows = document.querySelectorAll('.leaderboard-activity-row');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Maki');
    expect(rows[0].textContent).toContain('You');
    expect(rows[0].textContent).toContain('DDIA Chapter 7');
    expect(rows[0].textContent).toContain('Today');
    expect(rows[1].textContent).toContain('Alex');
    expect(rows[1].textContent).toContain('Two Sum');
    expect(rows[1].textContent).toContain('Yesterday');
  });

  it('shows an empty-state message for the activity feed when there is nothing recent', async () => {
    renderApp();
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('No recent activity yet.')).toBeInTheDocument());
  });

  it('shows a loading state for the activity feed before it reports back', async () => {
    subscribeRecentActivities.mockReset().mockImplementation(() => () => {});
    renderApp();
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('Loading recent activity…')).toBeInTheDocument());
  });
});
