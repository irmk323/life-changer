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
  getProfile: vi.fn(), createProfile: vi.fn(), updateProfile: vi.fn(), subscribeAllProfiles: vi.fn(),
}));
vi.mock('./services/firebase/profile', () => ({ getProfile, createProfile, updateProfile, subscribeAllProfiles }));

const { subscribeAllProgress } = vi.hoisted(() => ({ subscribeAllProgress: vi.fn() }));
vi.mock('./services/firebase/leaderboardProgressRepository', () => ({ subscribeAllProgress }));

const { subscribeRecentActivities } = vi.hoisted(() => ({ subscribeRecentActivities: vi.fn() }));
vi.mock('./services/firebase/leaderboardActivityRepository', () => ({ subscribeRecentActivities }));

const { getDomainState } = vi.hoisted(() => ({ getDomainState: vi.fn() }));
vi.mock('./services/firebase/userDataRepository', () => ({ getDomainState }));

const { listUserEntities, createUserEntity, updateUserEntityFields, deleteUserEntity, getDailyLog, saveDailyLog, listWeeklyPlanItemsForRange } = vi.hoisted(() => ({
  listUserEntities: vi.fn(), createUserEntity: vi.fn(), updateUserEntityFields: vi.fn(), deleteUserEntity: vi.fn(),
  getDailyLog: vi.fn(), saveDailyLog: vi.fn(), listWeeklyPlanItemsForRange: vi.fn(),
}));
vi.mock('./services/firebase/userEntityRepository', () => ({
  listUserEntities, createUserEntity, updateUserEntityFields, deleteUserEntity, getDailyLog, saveDailyLog, listWeeklyPlanItemsForRange,
}));

const { getDsaNotes, saveDsaNotes } = vi.hoisted(() => ({ getDsaNotes: vi.fn(), saveDsaNotes: vi.fn() }));
vi.mock('./services/firebase/dsaNotesRepository', () => ({ getDsaNotes, saveDsaNotes }));

const fakeUser = { uid: 'user-1', displayName: 'Maki' } as User;
const fakeProfile = { uid: 'user-1', displayName: 'Maki', createdAt: 'a', updatedAt: 'a' };

const renderApp = () => render(
  <AuthProvider>
    <AppAuthGate>
      <AppStateProvider><App /></AppStateProvider>
    </AppAuthGate>
  </AuthProvider>,
);

describe('DSA detail page — reviewNotes-missing regression (blank-screen crash)', () => {
  let authStateCallback: (user: User | null) => void;

  beforeEach(() => {
    window.location.hash = '#/dsa/dsa-1';
    localStorage.clear();
    subscribeToAuthState.mockReset().mockImplementation((cb: (user: User | null) => void) => {
      authStateCallback = cb;
      return () => {};
    });
    getProfile.mockReset().mockResolvedValue(fakeProfile);
    subscribeAllProfiles.mockReset().mockImplementation((cb: (all: unknown[]) => void) => { cb([fakeProfile]); return () => {}; });
    subscribeAllProgress.mockReset().mockImplementation((cb: (all: unknown[]) => void) => { cb([]); return () => {}; });
    subscribeRecentActivities.mockReset().mockImplementation((_limit: number, cb: (all: unknown[]) => void) => { cb([]); return () => {}; });
    listUserEntities.mockReset().mockResolvedValue([]);
    createUserEntity.mockReset().mockResolvedValue(undefined);
    updateUserEntityFields.mockReset().mockResolvedValue(undefined);
    deleteUserEntity.mockReset().mockResolvedValue(undefined);
    getDailyLog.mockReset().mockResolvedValue(null);
    saveDailyLog.mockReset().mockResolvedValue(undefined);
    listWeeklyPlanItemsForRange.mockReset().mockResolvedValue([]);
    saveDsaNotes.mockReset().mockResolvedValue(undefined);

    // dsa-1 is already marked solved with review stages generated (D1/D4/D17) — this is
    // what makes DsaNotesFieldsLoaded actually iterate over `stages` and read
    // notes.reviewNotes[stage].
    getDomainState.mockReset().mockImplementation((_uid: string, name: string) =>
      Promise.resolve(name === 'dsa' ? {
        'dsa-1': {
          firstSolvedAt: '2026-08-01',
          reviews: [
            { id: 'dsa-1-d1', stage: 'D1', dueAt: '2026-08-02', completed: false, completedAt: null },
            { id: 'dsa-1-d4', stage: 'D4', dueAt: '2026-08-05', completed: false, completedAt: null },
            { id: 'dsa-1-d17', stage: 'D17', dueAt: '2026-08-18', completed: false, completedAt: null },
          ],
        },
      } : {}));

    // The exact shape that reproduced the crash: a saved dsaNotes document that has
    // initialNotes but no reviewNotes field at all (because saveDsaNotes only ever writes
    // reviewNotes when a review stage was actually edited).
    getDsaNotes.mockReset().mockResolvedValue({ initialNotes: 'my earlier note', updatedAt: '2026-08-01T00:00:00.000Z' });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('renders the DSA detail page without crashing when reviewNotes is missing from the saved document', async () => {
    renderApp();
    authStateCallback(fakeUser);

    await waitFor(() => expect(screen.getByDisplayValue('my earlier note')).toBeInTheDocument());

    // The three review-stage fields must render with empty defaults instead of throwing.
    expect(screen.getByText('D1 review note')).toBeInTheDocument();
    expect(screen.getByText('D4 review note')).toBeInTheDocument();
    expect(screen.getByText('D17 review note')).toBeInTheDocument();

    // No blank-screen crash: the page chrome (sidebar) is still there.
    expect(screen.getByText('DSA')).toBeInTheDocument();
  });
});
