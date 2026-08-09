// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileGate, useProfile } from './ProfileGate';

const { getProfile, createProfile, updateProfile } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
}));
vi.mock('../services/firebase/profile', () => ({ getProfile, createProfile, updateProfile }));

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('./AuthProvider', () => ({ useAuth }));

function Consumer() {
  const { profile } = useProfile();
  return <span>profile: {profile?.displayName ?? 'none'}</span>;
}

describe('ProfileGate', () => {
  afterEach(() => cleanup());

  it('renders nothing when signed out (AppAuthGate is responsible for the signed-out state)', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    const { container } = render(<ProfileGate><span>content</span></ProfileGate>);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the profile setup form when signed in with no existing profile, then reveals children once created', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1', displayName: 'Maki G' }, loading: false });
    getProfile.mockResolvedValue(null);
    createProfile.mockResolvedValue({ uid: 'u1', displayName: 'Maki', createdAt: 'a', updatedAt: 'a' });

    render(<ProfileGate><Consumer /></ProfileGate>);

    await waitFor(() => expect(screen.getByText('Set up your Leaderboard profile')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Maki G')).toBeInTheDocument();
    expect(screen.queryByText(/profile:/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Save and continue'));
    await waitFor(() => expect(screen.getByText('profile: Maki')).toBeInTheDocument());
  });

  it('renders children directly (skipping setup) once an existing profile is found', async () => {
    useAuth.mockReturnValue({ user: { uid: 'u1', displayName: 'Maki' }, loading: false });
    getProfile.mockResolvedValue({ uid: 'u1', displayName: 'Maki', createdAt: 'a', updatedAt: 'a' });

    render(<ProfileGate><Consumer /></ProfileGate>);

    await waitFor(() => expect(screen.getByText('profile: Maki')).toBeInTheDocument());
    expect(screen.queryByText('Set up your Leaderboard profile')).not.toBeInTheDocument();
  });
});
