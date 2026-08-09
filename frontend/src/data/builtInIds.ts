import behaviourQuestions from './questions/behaviour.json';
import javaTheoryCoreQuestions from './questions/javaTheoryCore.json';
import javaTheorySpringQuestions from './questions/javaTheorySpring.json';
import ddiaQuestions from './questions/ddia.json';
import dsaProblems from './questions/dsa.json';

// Mirrors the deterministic id generation in sampleData.ts. Used to tell whether a
// learningItems id refers to built-in seed content (only lightweight per-user state is
// stored in Firestore) or a user-created custom question (full content is stored).
export const BEHAVIOUR_ITEM_IDS: readonly string[] = behaviourQuestions.map((_, i) => `behaviour-${i + 1}`);
export const JAVA_CORE_ITEM_IDS: readonly string[] = javaTheoryCoreQuestions.map((_, i) => `java-core-${i + 1}`);
export const JAVA_SPRING_ITEM_IDS: readonly string[] = javaTheorySpringQuestions.map((_, i) => `java-spring-${i + 1}`);
export const DDIA_QUESTION_ITEM_IDS: readonly string[] = ddiaQuestions.map((_, i) => `ddia-${i + 1}-q1`);
export const DSA_PROBLEM_IDS: readonly string[] = dsaProblems.map((_, i) => `dsa-${i + 1}`);

const ALL_BUILT_IN_LEARNING_ITEM_IDS = new Set<string>([
  ...BEHAVIOUR_ITEM_IDS,
  ...JAVA_CORE_ITEM_IDS,
  ...JAVA_SPRING_ITEM_IDS,
  ...DDIA_QUESTION_ITEM_IDS,
]);

export const isBuiltInLearningItemId = (id: string): boolean => ALL_BUILT_IN_LEARNING_ITEM_IDS.has(id);
