import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import type { AppState } from '../types/appState';
import { useAuth } from './AuthProvider';
import { loadInitialAppState } from './loadInitialAppState';
import { syncActionToFirestore, type AppAction } from './firestoreActionSync';

type Action = AppAction;

interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  reload: () => Promise<void>;
}

const Context = createContext<AppStateContextValue | null>(null);

// Pure local-state reducer — unchanged from the pre-Firestore implementation. Firestore
// persistence is a side effect layered on top by the dispatch wrapper below
// (see firestoreActionSync.ts), not something this function does itself.
const reducer = (s: AppState, a: Action): AppState => {
  const p = a.payload as any;
  const collection = p?.collection as keyof AppState;
  switch (a.type) {
    case 'REPLACE': return p;
    case 'UPSERT': {
      const list = s[collection] as any[];
      const exists = list.some((x) => x.id === p.item.id);
      return { ...s, [collection]: exists ? list.map((x) => (x.id === p.item.id ? { ...x, ...p.item } : x)) : [...list, p.item] };
    }
    case 'DELETE': return { ...s, [collection]: (s[collection] as any[]).filter((x) => x.id !== p.id) };
    case 'DISMISS_AUTO': return { ...s, dismissedAutomaticPriorities: [...s.dismissedAutomaticPriorities, p] };
    case 'PRIORITY_REORDER': {
      const list = [...s.priorities];
      const index = list.findIndex((x) => x.id === p.id), next = index + p.direction;
      if (index < 0 || next < 0 || next >= list.length) return s;
      [list[index], list[next]] = [list[next], list[index]];
      return { ...s, priorities: list.map((x, i) => ({ ...x, order: i })) };
    }
    case 'LEARNING_UPDATE': return { ...s, learningItems: s.learningItems.map((x) => (x.id === p.id ? { ...x, ...p } : x)) };
    case 'DSA_UPDATE': return { ...s, dsa: s.dsa.map((x) => (x.id === p.id ? { ...x, ...p } : x)) };
    case 'DAILY_LOG_SAVE': return { ...s, dailyLogs: [...s.dailyLogs.filter((x) => x.date !== p.date), p] };
    default: return s;
  }
};

const EMPTY_STATE: AppState = {
  version: 1, motivationEntries: [], learningItems: [], attempts: [], reviews: [], dsa: [],
  dailyLogs: [], weeklyPlanItems: [], activities: [], priorities: [], dismissedAutomaticPriorities: [],
  functionalTasks: [], systemDesignTasks: [], ddiaChapters: [],
};

// Only ever mounted once AppAuthGate/ProfileGate confirm a signed-in user, so `user` is
// non-null for the lifetime of this component (it doesn't render its own signed-out UI).
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, reactDispatch] = useReducer(reducer, EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadInitialAppState(user.uid);
      reactDispatch({ type: 'REPLACE', payload: loaded });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void reload(); }, [reload]);

  const dispatch = useCallback((action: Action) => {
    if (user) syncActionToFirestore(user.uid, stateRef.current, action);
    reactDispatch(action);
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8f7] text-[#657777]">
        Loading your data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f8f7] p-4 text-center text-[#657777]">
        <p>{error}</p>
        <button type="button" className="rounded border px-3 py-2 text-[#203334]" onClick={() => void reload()}>
          Try again
        </button>
      </div>
    );
  }

  return <Context.Provider value={{ state, dispatch, reload }}>{children}</Context.Provider>;
}

export const useAppState = () => {
  const x = useContext(Context);
  if (!x) throw Error('Missing AppStateProvider');
  return x;
};
