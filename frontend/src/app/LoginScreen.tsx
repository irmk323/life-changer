import { useState } from 'react';
import { useAuth } from './AuthProvider';

export function LoginScreen() {
  const { signIn, error } = useAuth();
  const [pending, setPending] = useState(false);

  const handleSignIn = async () => {
    setPending(true);
    try {
      await signIn();
    } catch {
      // surfaced via useAuth().error below
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8f7] p-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[#203334]">
          Life <span className="text-[#21675d]">Changer</span>
        </h1>
        <p className="mt-2 text-sm text-[#657777]">
          Sign in with Google to access your interview preparation data.
        </p>
        <button
          type="button"
          className="dashboard-primary mx-auto mt-6"
          onClick={() => void handleSignIn()}
          disabled={pending}
        >
          {pending ? "Signing in…" : "Continue with Google"}
        </button>
        {error && <p className="mt-3 text-sm text-[#923d36]">{error}</p>}
      </div>
    </div>
  );
}
