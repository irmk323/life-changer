// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../services/firebase/auth';
import { AuthProvider, useAuth } from './AuthProvider';

const { subscribeToAuthState, signInWithGoogle, signOutUser } = vi.hoisted(() => ({
  subscribeToAuthState: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
}));

vi.mock('../services/firebase/auth', () => ({ subscribeToAuthState, signInWithGoogle, signOutUser }));

const fakeUser = { uid: 'user-1', displayName: 'Maki' } as User;

function Consumer() {
  const { user, loading, error, signIn, signOut } = useAuth();
  return (
    <div>
      <span>loading: {String(loading)}</span>
      <span>user: {user?.displayName ?? 'none'}</span>
      <span>error: {error ?? 'none'}</span>
      <button onClick={() => { signIn().catch(() => {}); }}>Sign in</button>
      <button onClick={() => { void signOut(); }}>Sign out</button>
    </div>
  );
}

describe('AuthProvider', () => {
  let authStateCallback: (user: User | null) => void;

  afterEach(() => cleanup());

  beforeEach(() => {
    subscribeToAuthState.mockReset().mockImplementation((cb: (user: User | null) => void) => {
      authStateCallback = cb;
      return () => {};
    });
    signInWithGoogle.mockReset();
    signOutUser.mockReset();
  });

  it('starts in a loading state and reflects the signed-in user once Firebase reports it', async () => {
    render(<AuthProvider><Consumer /></AuthProvider>);
    expect(screen.getByText('loading: true')).toBeInTheDocument();
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('loading: false')).toBeInTheDocument());
    expect(screen.getByText('user: Maki')).toBeInTheDocument();
  });

  it('reflects sign-out by reporting user: none once Firebase reports null', async () => {
    render(<AuthProvider><Consumer /></AuthProvider>);
    authStateCallback(fakeUser);
    await waitFor(() => expect(screen.getByText('user: Maki')).toBeInTheDocument());
    authStateCallback(null);
    await waitFor(() => expect(screen.getByText('user: none')).toBeInTheDocument());
  });

  it('propagates sign-in errors instead of swallowing them', async () => {
    signInWithGoogle.mockRejectedValue(new Error('popup blocked'));
    render(<AuthProvider><Consumer /></AuthProvider>);
    fireEvent.click(screen.getByText('Sign in'));
    await waitFor(() => expect(screen.getByText('error: popup blocked')).toBeInTheDocument());
  });
});
