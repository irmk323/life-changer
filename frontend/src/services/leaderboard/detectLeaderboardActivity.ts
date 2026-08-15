import type { AppState } from '../../types/appState';

export interface LeaderboardActivityEvent {
  domain: 'DSA' | 'DDIA' | 'HELLO_INTERVIEW';
  label: string;
  occurredAt: string;
}

const findDsaEvents = (previous: AppState, next: AppState, occurredAt: string): LeaderboardActivityEvent[] =>
  next.dsa
    .filter((problem) => problem.firstSolvedAt && !previous.dsa.find((p) => p.id === problem.id)?.firstSolvedAt)
    .map((problem) => ({ domain: 'DSA' as const, label: problem.title, occurredAt }));

const findDdiaEvents = (previous: AppState, next: AppState, occurredAt: string): LeaderboardActivityEvent[] =>
  next.ddiaChapters
    .filter((chapter) => chapter.status === 'DONE' && previous.ddiaChapters.find((c) => c.id === chapter.id)?.status !== 'DONE')
    .map((chapter) => ({ domain: 'DDIA' as const, label: `DDIA Chapter ${chapter.id.replace('CHAPTER_', '')}`, occurredAt }));

const findHelloInterviewEvents = (previous: AppState, next: AppState, occurredAt: string): LeaderboardActivityEvent[] =>
  next.systemDesignTasks
    .filter((task) => task.status === 'INTERVIEW_READY' && previous.systemDesignTasks.find((t) => t.id === task.id)?.status !== 'INTERVIEW_READY')
    .map((task) => ({ domain: 'HELLO_INTERVIEW' as const, label: task.title, occurredAt }));

// Pure so "which items just flipped to completed" is unit-testable without React/Firebase.
// `previous === null` means there's nothing to diff against yet (e.g. first render after
// sign-in) — in that case no events are produced, so a user's entire pre-existing history
// isn't replayed as a burst of "just completed" activity the moment they sign in.
export const detectLeaderboardActivity = (previous: AppState | null, next: AppState, occurredAt: string): LeaderboardActivityEvent[] => {
  if (!previous) return [];
  return [
    ...findDsaEvents(previous, next, occurredAt),
    ...findDdiaEvents(previous, next, occurredAt),
    ...findHelloInterviewEvents(previous, next, occurredAt),
  ];
};
