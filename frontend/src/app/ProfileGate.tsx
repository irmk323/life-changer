import { createContext, useContext, useEffect, useState } from 'react';
import type { LeaderboardProfile } from '../types/leaderboard';
import { createProfile, getProfile, updateProfile } from '../services/firebase/profile';
import { useAuth } from './AuthProvider';

interface ProfileContextValue {
  // null while signed out — ProfileGate only ever mounts children with a real profile
  // once the user is signed in (it shows ProfileSetupForm instead until then), so callers
  // that already know the user is signed in can treat this as non-null.
  profile: LeaderboardProfile | null;
  renameProfile: (displayName: string) => Promise<void>;
}

const defaultProfileContext: ProfileContextValue = { profile: null, renameProfile: async () => {} };
const ProfileContext = createContext<ProfileContextValue>(defaultProfileContext);

// Safe to call unconditionally (even when signed out) — see the profile field's doc comment.
export const useProfile = () => useContext(ProfileContext);

function ProfileSetupForm({ uid, defaultDisplayName, onCreated }: {
  uid: string;
  defaultDisplayName: string;
  onCreated: (profile: LeaderboardProfile) => void;
}) {
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      onCreated(await createProfile(uid, trimmed));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="lc-panel mx-auto max-w-md rounded-xl border bg-white p-6">
      <h2 className="font-bold">Set up your Leaderboard profile</h2>
      <p className="mb-4 text-sm text-[#657777]">
        Choose the name other people preparing with you will see. You can change it later.
      </p>
      <form className="flex flex-col gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <label className="grid gap-1 text-sm font-semibold">
          Display name
          <input
            className="rounded border p-2 font-normal"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="dashboard-primary" disabled={saving || !displayName.trim()}>
          {saving ? "Saving…" : "Save and continue"}
        </button>
        {error && <p className="text-sm text-[#923d36]">{error}</p>}
      </form>
    </section>
  );
}

// Only ever mounted by AppAuthGate once a signed-in user is confirmed, so `user` is
// guaranteed non-null here — AppAuthGate owns the auth-loading and signed-out states.
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<LeaderboardProfile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setChecking(true);
    getProfile(user.uid)
      .then((result) => { if (!cancelled) setProfile(result); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [user]);

  const renameProfile = async (displayName: string) => {
    if (!profile) return;
    setProfile(await updateProfile(profile, displayName));
  };

  if (!user || checking) return null;
  if (!profile) {
    return <ProfileSetupForm uid={user.uid} defaultDisplayName={user.displayName ?? ''} onCreated={setProfile} />;
  }

  return <ProfileContext.Provider value={{ profile, renameProfile }}>{children}</ProfileContext.Provider>;
}
