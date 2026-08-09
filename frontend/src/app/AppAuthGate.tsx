import { useAuth } from './AuthProvider';
import { LoginScreen } from './LoginScreen';
import { ProfileGate } from './ProfileGate';

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8f7] text-[#657777]">
      Loading…
    </div>
  );
}

// Whole-app gate: nothing (not even a flash of the Login screen or the Dashboard) renders
// until onAuthStateChanged has reported back. Google Login is required for the entire app,
// not just Leaderboard — there is no "signed out -> localStorage" fallback path.
export function AppAuthGate({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <LoginScreen />;
  return <ProfileGate>{children}</ProfileGate>;
}
