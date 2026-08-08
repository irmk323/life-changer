import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../services/firebase/auth';
import { signInWithGoogle, signOutUser, subscribeToAuthState } from '../services/firebase/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToAuthState((nextUser) => {
    setUser(nextUser);
    setLoading(false);
  }), []);

  const signIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(errorMessage(err, 'Failed to sign in with Google.'));
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await signOutUser();
    } catch (err) {
      setError(errorMessage(err, 'Failed to sign out.'));
      throw err;
    }
  };

  return <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('Missing AuthProvider');
  return context;
};
