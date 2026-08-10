import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Without this, any uncaught render error anywhere in the tree unmounts the whole app,
// leaving a blank white screen that not even browser back can recover from (only a hard
// reload does) — see the DsaNotesFields crash this was added to guard against. Class
// component because React error boundaries have no hook equivalent.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error in app:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-4 text-center text-[#657777]">
          <p className="text-lg font-semibold text-[#203334]">Something went wrong.</p>
          <p className="max-w-md text-sm">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded border px-3 py-2 text-[#203334]"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
