import type { AppState } from '../../types/appState';
import { progress } from '../readiness/calculations';
import ddiaQuestions from '../../data/questions/ddia.json';

export interface LeaderboardDomainProgress { completed: number; total: number; percentage: number }
export interface LeaderboardProgress {
  dsa: LeaderboardDomainProgress;
  ddia: LeaderboardDomainProgress;
  helloInterview: LeaderboardDomainProgress;
}

// DDIA chapter count is derived from the question bank (source of truth for the
// built-in curriculum) rather than duplicating App.tsx's DDIA_CHAPTERS title list.
const DDIA_CHAPTER_COUNT = new Set(ddiaQuestions.map((q) => q.chapter)).size;

const percentage = (completed: number, total: number) => (total ? Math.round((completed / total) * 100) : 0);

// state.systemDesignTasks ("Hello Interview") has no field distinguishing built-in
// curriculum tasks from custom ones, but the "Add task" UI for this list was removed
// so it only ever holds the built-in curriculum. See docs/firebase-leaderboard-tasks.md
// (Phase 2A) for background.
export const calculateLeaderboardProgress = (state: AppState): LeaderboardProgress => {
  const dsaProgress = progress(state.dsa, true);

  const ddiaCompleted = Array.from({ length: DDIA_CHAPTER_COUNT }, (_, i) => `CHAPTER_${i + 1}`)
    .filter((id) => state.ddiaChapters.find((c) => c.id === id)?.status === 'DONE').length;

  const helloInterviewCompleted = state.systemDesignTasks.filter((t) => t.status === 'INTERVIEW_READY').length;
  const helloInterviewTotal = state.systemDesignTasks.length;

  return {
    dsa: { completed: dsaProgress.done, total: dsaProgress.total, percentage: dsaProgress.percentage },
    ddia: { completed: ddiaCompleted, total: DDIA_CHAPTER_COUNT, percentage: percentage(ddiaCompleted, DDIA_CHAPTER_COUNT) },
    helloInterview: {
      completed: helloInterviewCompleted,
      total: helloInterviewTotal,
      percentage: percentage(helloInterviewCompleted, helloInterviewTotal),
    },
  };
};
