import type { AppState, ChapterStatus, DsaProblem, LearningItem } from '../types/appState';
import type { DomainStateName } from '../services/firebase/userDataRepository';
import behaviourQuestions from '../data/questions/behaviour.json';
import javaTheoryCoreQuestions from '../data/questions/javaTheoryCore.json';
import javaTheorySpringQuestions from '../data/questions/javaTheorySpring.json';
import ddiaQuestions from '../data/questions/ddia.json';
import dsaProblems from '../data/questions/dsa.json';
import { isBuiltInLearningItemId } from '../data/builtInIds';

// Firestore-stored shape for one learningItem's lightweight state (domainState/*).
// personalAnswer/notes/followUps are NOT here — those live in answers/{itemId} and are
// lazily loaded only when a question is opened (see answersRepository.ts).
export interface DomainItemState {
  latestResult: LearningItem['latestResult'];
  lastPractisedAt: string | null;
  nextReviewAt: string | null;
  track?: string; // only meaningful for shared maps (ddia.questions, helloInterview)
  custom?: { title: string; question: string; category: string; modelAnswer?: string };
}

export type DomainItemStateMap = Record<string, DomainItemState>;

export interface DdiaDomainState {
  chapters: Record<string, { status: ChapterStatus['status']; notes: string }>;
  questions: DomainItemStateMap;
}

export interface DashboardDomainState {
  dismissedAutomaticPriorities: string[];
}

export interface RawDomainState {
  dsa: Record<string, { firstSolvedAt: string | null; reviews: DsaProblem['reviews'] }>;
  ddia: DdiaDomainState;
  behaviour: DomainItemStateMap;
  javaCore: DomainItemStateMap;
  javaSpring: DomainItemStateMap;
  helloInterview: DomainItemStateMap;
  dashboard: DashboardDomainState;
}

// Which domainState document (+ dot-path prefix within it) a learningItem's lightweight
// fields live in, given its domain/track. Used by both assembly (read) and the
// AppStateProvider dispatch sync layer (write) so the two stay in lockstep.
export const learningItemLocation = (domain: string, track: string): { doc: DomainStateName; pathPrefix: string } => {
  if (domain === 'BEHAVIOUR') return { doc: 'behaviour', pathPrefix: '' };
  if (domain === 'JAVA_THEORY') return { doc: track === 'SPRING_BOOT' ? 'javaSpring' : 'javaCore', pathPrefix: '' };
  if (domain === 'DDIA') return { doc: 'ddia', pathPrefix: 'questions.' };
  if (domain === 'SYSTEM_DESIGN') return { doc: 'helloInterview', pathPrefix: '' };
  throw new Error(`Unknown learningItem domain: ${domain}`);
};

const buildLearningItem = (
  id: string, domain: LearningItem['domain'], track: string, title: string, category: string,
  modelAnswer: string, keyPoints: string[], s: DomainItemState | undefined,
): LearningItem => ({
  id, domain, track,
  title: s?.custom?.title ?? title,
  question: s?.custom?.question ?? title,
  category: s?.custom?.category ?? category,
  priority: 'P1',
  modelAnswer: s?.custom?.modelAnswer ?? modelAnswer,
  personalAnswer: '', notes: '', followUps: '',
  latestResult: s?.latestResult ?? null,
  lastPractisedAt: s?.lastPractisedAt ?? null,
  nextReviewAt: s?.nextReviewAt ?? null,
  keyPoints,
});

const customEntries = (map: DomainItemStateMap): [string, DomainItemState][] =>
  Object.entries(map).filter(([id]) => !isBuiltInLearningItemId(id));

const assembleBehaviour = (map: DomainItemStateMap): LearningItem[] => [
  ...behaviourQuestions.map((q, i) => {
    const id = `behaviour-${i + 1}`;
    return buildLearningItem(id, 'BEHAVIOUR', 'BEHAVIOUR', q.title, q.category, '', [], map[id]);
  }),
  ...customEntries(map).map(([id, s]) => buildLearningItem(id, 'BEHAVIOUR', 'BEHAVIOUR', '', '', '', [], s)),
];

const assembleJava = (map: DomainItemStateMap, track: 'CORE_JAVA' | 'SPRING_BOOT'): LearningItem[] => {
  const source = track === 'CORE_JAVA' ? javaTheoryCoreQuestions : javaTheorySpringQuestions;
  const prefix = track === 'CORE_JAVA' ? 'java-core' : 'java-spring';
  return [
    ...source.map((q, i) => {
      const id = `${prefix}-${i + 1}`;
      return buildLearningItem(id, 'JAVA_THEORY', track, q.title, q.category, q.modelAnswer, q.keyPoints, map[id]);
    }),
    ...customEntries(map).map(([id, s]) => buildLearningItem(id, 'JAVA_THEORY', track, '', '', '', [], s)),
  ];
};

const assembleDdiaQuestions = (map: DomainItemStateMap): LearningItem[] => [
  ...ddiaQuestions.map((q, i) => {
    const id = `ddia-${i + 1}-q1`;
    return buildLearningItem(id, 'DDIA', `CHAPTER_${q.chapter}`, q.title, 'System design', '', [], map[id]);
  }),
  ...customEntries(map).map(([id, s]) => buildLearningItem(id, 'DDIA', s.track ?? 'CHAPTER_1', '', '', '', [], s)),
];

const assembleHelloInterviewQuestions = (map: DomainItemStateMap): LearningItem[] =>
  // All entries here are custom (Hello Interview sub-questions have no built-in seed content).
  Object.entries(map).map(([id, s]) => buildLearningItem(id, 'SYSTEM_DESIGN', s.track ?? '', '', '', '', [], s));

export const assembleLearningItems = (raw: Pick<RawDomainState, 'behaviour' | 'javaCore' | 'javaSpring' | 'ddia' | 'helloInterview'>): LearningItem[] => [
  ...assembleBehaviour(raw.behaviour),
  ...assembleJava(raw.javaCore, 'CORE_JAVA'),
  ...assembleJava(raw.javaSpring, 'SPRING_BOOT'),
  ...assembleDdiaQuestions(raw.ddia.questions ?? {}),
  ...assembleHelloInterviewQuestions(raw.helloInterview),
];

export const assembleDsa = (map: RawDomainState['dsa']): DsaProblem[] =>
  dsaProblems.map((x, i) => {
    const id = `dsa-${i + 1}`;
    const s = map[id];
    return {
      id, title: x.title, category: x.category, difficulty: x.difficulty,
      leetcodeUrl: `https://leetcode.com/problems/${x.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/`,
      firstSolvedAt: s?.firstSolvedAt ?? null,
      initialNotes: '', generalNotes: '', // lazy-loaded via dsaNotesRepository.ts
      reviews: s?.reviews ?? [],
    };
  });

const DDIA_CHAPTER_COUNT = new Set(ddiaQuestions.map((q) => q.chapter)).size;

export const assembleDdiaChapters = (chapters: DdiaDomainState['chapters']): ChapterStatus[] =>
  Array.from({ length: DDIA_CHAPTER_COUNT }, (_, i) => {
    const id = `CHAPTER_${i + 1}`;
    return { id, status: chapters[id]?.status ?? 'NOT_STARTED', notes: chapters[id]?.notes ?? '' };
  });

export const emptyRawDomainState = (): RawDomainState => ({
  dsa: {}, ddia: { chapters: {}, questions: {} }, behaviour: {}, javaCore: {}, javaSpring: {}, helloInterview: {},
  dashboard: { dismissedAutomaticPriorities: [] },
});

export const assembleCoreAppState = (raw: RawDomainState): Pick<AppState, 'learningItems' | 'dsa' | 'ddiaChapters' | 'dismissedAutomaticPriorities'> => ({
  learningItems: assembleLearningItems(raw),
  dsa: assembleDsa(raw.dsa),
  ddiaChapters: assembleDdiaChapters(raw.ddia.chapters ?? {}),
  dismissedAutomaticPriorities: raw.dashboard.dismissedAutomaticPriorities ?? [],
});
