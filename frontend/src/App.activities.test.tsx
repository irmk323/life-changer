// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from './services/firebase/auth';
import { AppStateProvider } from './app/AppStateProvider';
import { AuthProvider } from './app/AuthProvider';
import { AppAuthGate } from './app/AppAuthGate';
import App from './App';

const { subscribeToAuthState, signInWithGoogle, signOutUser } = vi.hoisted(() => ({
  subscribeToAuthState: vi.fn(), signInWithGoogle: vi.fn(), signOutUser: vi.fn(),
}));
vi.mock('./services/firebase/auth', () => ({ subscribeToAuthState, signInWithGoogle, signOutUser }));

const { getProfile, createProfile, updateProfile, subscribeAllProfiles } = vi.hoisted(() => ({
  getProfile: vi.fn(), createProfile: vi.fn(), updateProfile: vi.fn(), subscribeAllProfiles: vi.fn(),
}));
vi.mock('./services/firebase/profile', () => ({ getProfile, createProfile, updateProfile, subscribeAllProfiles }));

const { subscribeAllProgress, syncLeaderboardProgress } = vi.hoisted(() => ({ subscribeAllProgress: vi.fn(), syncLeaderboardProgress: vi.fn() }));
vi.mock('./services/firebase/leaderboardProgressRepository', () => ({ subscribeAllProgress, syncLeaderboardProgress }));

const { subscribeRecentActivities, postLeaderboardActivity } = vi.hoisted(() => ({ subscribeRecentActivities: vi.fn(), postLeaderboardActivity: vi.fn() }));
vi.mock('./services/firebase/leaderboardActivityRepository', () => ({ subscribeRecentActivities, postLeaderboardActivity }));

const { getDomainState, updateDomainStateField, deleteDomainStateField, setDomainState } = vi.hoisted(() => ({
  getDomainState: vi.fn(), updateDomainStateField: vi.fn(), deleteDomainStateField: vi.fn(), setDomainState: vi.fn(),
}));
vi.mock('./services/firebase/userDataRepository', () => ({ getDomainState, updateDomainStateField, deleteDomainStateField, setDomainState }));

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

// A stable, real-looking entity store shared across the mocked repository functions, since
// activity-creation dispatches an UPSERT that flows through the normal Firestore sync layer.
function makeEntityStore() {
  const byCollection = new Map<string, Map<string, any>>();
  const get = (name: string) => byCollection.get(name) ?? byCollection.set(name, new Map()).get(name)!;
  listUserEntities.mockImplementation((_uid: string, name: string) => Promise.resolve(Array.from(get(name).values())));
  createUserEntity.mockImplementation((_uid: string, name: string, item: any) => { get(name).set(item.id, item); return Promise.resolve(); });
  updateUserEntityFields.mockImplementation((_uid: string, name: string, id: string, patch: any) => {
    const map = get(name);
    map.set(id, { ...(map.get(id) ?? {}), ...patch });
    return Promise.resolve();
  });
  return byCollection;
}

describe('Personal activity logging (Calendar/Dashboard "activities")', () => {
  let authStateCallback: (user: User | null) => void;

  beforeEach(() => {
    window.location.hash = '#/dsa';
    localStorage.clear();
    subscribeToAuthState.mockReset().mockImplementation((cb: (user: User | null) => void) => {
      authStateCallback = cb;
      return () => {};
    });
    getProfile.mockReset().mockResolvedValue(fakeProfile);
    subscribeAllProfiles.mockReset().mockImplementation((cb: (all: unknown[]) => void) => { cb([fakeProfile]); return () => {}; });
    subscribeAllProgress.mockReset().mockImplementation((cb: (all: unknown[]) => void) => { cb([]); return () => {}; });
    syncLeaderboardProgress.mockReset().mockResolvedValue(undefined);
    subscribeRecentActivities.mockReset().mockImplementation((_limit: number, cb: (all: unknown[]) => void) => { cb([]); return () => {}; });
    postLeaderboardActivity.mockReset().mockResolvedValue(undefined);
    getDomainState.mockReset().mockResolvedValue({});
    updateDomainStateField.mockReset().mockResolvedValue(undefined);
    deleteDomainStateField.mockReset().mockResolvedValue(undefined);
    setDomainState.mockReset().mockResolvedValue(undefined);
    deleteUserEntity.mockReset().mockResolvedValue(undefined);
    getDailyLog.mockReset().mockResolvedValue(null);
    saveDailyLog.mockReset().mockResolvedValue(undefined);
    listWeeklyPlanItemsForRange.mockReset().mockResolvedValue([]);
    getDsaNotes.mockReset().mockResolvedValue(null);
    saveDsaNotes.mockReset().mockResolvedValue(undefined);
    makeEntityStore();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('marking a DSA problem solved logs a personal activity visible on the Dashboard', async () => {
    renderApp();
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('DSA Progress')).toBeInTheDocument());

    const row = Array.from(document.querySelectorAll('tr')).find((r) => r.textContent?.includes('Contains Duplicate'))!;
    const dateInput = row.querySelector('input[type="date"]') as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    act(() => {
      nativeSetter.call(dateInput, '2026-08-09');
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    window.location.hash = '#/dashboard';
    await waitFor(() => expect(screen.getByText('Contains Duplicate')).toBeInTheDocument());
    expect(screen.getByText('2026-08-09')).toBeInTheDocument();
  });

  it('marking a DDIA chapter Done logs a personal activity', async () => {
    window.location.hash = '#/system-design/ddia/1';
    renderApp();
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('Have you read this chapter?')).toBeInTheDocument());

    act(() => { screen.getByRole('button', { name: 'Done' }).click(); });

    window.location.hash = '#/dashboard';
    await waitFor(() => expect(screen.getByText('DDIA Chapter 1')).toBeInTheDocument());
  });

  it('does not re-log a duplicate activity when a chapter already marked Done is saved again', async () => {
    getDomainState.mockImplementation((_uid: string, name: string) =>
      Promise.resolve(name === 'ddia' ? { chapters: { CHAPTER_1: { status: 'DONE', notes: '' } } } : {}));
    window.location.hash = '#/system-design/ddia/1';
    renderApp();
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Done' })).toHaveClass('status-toggle__option--active'));

    act(() => { screen.getByRole('button', { name: 'Done' }).click(); });

    window.location.hash = '#/dashboard';
    await waitFor(() => expect(screen.getByText('Recent activity')).toBeInTheDocument());
    expect(screen.queryByText('DDIA Chapter 1')).not.toBeInTheDocument();
  });
});
