// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppAuthGate } from './AppAuthGate';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('./AuthProvider', () => ({ useAuth }));

const { getProfile } = vi.hoisted(() => ({ getProfile: vi.fn() }));
vi.mock('../services/firebase/profile', () => ({ getProfile, createProfile: vi.fn(), updateProfile: vi.fn() }));

describe('AppAuthGate', () => {
  afterEach(() => cleanup());

  it('shows a loading state while auth is resolving, never the Login screen or app content', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    render(<AppAuthGate><span>app content</span></AppAuthGate>);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });

  it('shows the Login screen once auth resolves to signed-out', () => {
    useAuth.mockReturnValue({ user: null, loading: false, error: null, signIn: vi.fn() });
    render(<AppAuthGate><span>app content</span></AppAuthGate>);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });

  it('renders app content once signed in with an existing profile', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1', displayName: 'Maki' }, loading: false, error: null, signIn: vi.fn() });
    getProfile.mockResolvedValue({ uid: 'u1', displayName: 'Maki', createdAt: 'a', updatedAt: 'a' });
    render(<AppAuthGate><span>app content</span></AppAuthGate>);
    await waitFor(() => expect(screen.getByText('app content')).toBeInTheDocument());
  });
});
