// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppStateProvider, useAppState } from './AppStateProvider';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('./AuthProvider', () => ({ useAuth }));

const { loadInitialAppState } = vi.hoisted(() => ({ loadInitialAppState: vi.fn() }));
vi.mock('./loadInitialAppState', () => ({ loadInitialAppState }));

vi.mock('./firestoreActionSync', () => ({ syncActionToFirestore: vi.fn() }));

const emptyState = {
  version: 1, motivationEntries: [], learningItems: [], attempts: [], reviews: [], dsa: [],
  dailyLogs: [], weeklyPlanItems: [], activities: [], priorities: [], dismissedAutomaticPriorities: [],
  functionalTasks: [], systemDesignTasks: [], ddiaChapters: [],
};

function Consumer() {
  const { state } = useAppState();
  return <span>priorities: {state.priorities.length}</span>;
}

describe('AppStateProvider', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { uid: 'u1' } });
    loadInitialAppState.mockReset();
  });

  afterEach(() => cleanup());

  it('shows a loading state before Firestore data resolves', async () => {
    loadInitialAppState.mockReturnValue(new Promise(() => {}));
    render(<AppStateProvider><Consumer /></AppStateProvider>);
    expect(screen.getByText('Loading your data…')).toBeInTheDocument();
  });

  it('renders children with the loaded state once Firestore resolves', async () => {
    loadInitialAppState.mockResolvedValue({ ...emptyState, priorities: [{ id: 'p1' }] });
    render(<AppStateProvider><Consumer /></AppStateProvider>);
    await waitFor(() => expect(screen.getByText('priorities: 1')).toBeInTheDocument());
  });

  it('shows an error state with a retry button when the initial load fails', async () => {
    loadInitialAppState.mockRejectedValue(new Error('Missing or insufficient permissions.'));
    render(<AppStateProvider><Consumer /></AppStateProvider>);
    await waitFor(() => expect(screen.getByText('Missing or insufficient permissions.')).toBeInTheDocument());
    expect(screen.queryByText(/priorities:/)).not.toBeInTheDocument();
  });

  it('retries loading when "Try again" is clicked after an error', async () => {
    loadInitialAppState.mockRejectedValueOnce(new Error('offline'));
    render(<AppStateProvider><Consumer /></AppStateProvider>);
    await waitFor(() => expect(screen.getByText('offline')).toBeInTheDocument());

    loadInitialAppState.mockResolvedValueOnce(emptyState);
    fireEvent.click(screen.getByText('Try again'));
    await waitFor(() => expect(screen.getByText('priorities: 0')).toBeInTheDocument());
  });
});
