import type { AppState } from "../types/appState";
import { addDays, localDate } from "../services/readiness/calculations";

const question = (
  id: string, domain: any, track: string, title: string, category: string,
  result: any = null, next = addDays(3), last = result ? addDays(-2) : null,
): any => ({ id, domain, track, title, question: title, category, priority: "P1", modelAnswer: `A concise prepared answer for “${title}”. Start with the principle, explain the trade-off, then give a production example.`, personalAnswer: "", notes: "", followUps: "What trade-offs would you discuss?", latestResult: result, lastPractisedAt: last, nextReviewAt: next });
const review = (id: string, stage: any, days: number) => ({ id, stage, dueAt: addDays(days), completed: false, completedAt: null, note: "" });
const functionalTitles = ["Booking API", "Payment Service", "Notification Service", "Inventory Reservation", "Rate Limiter"];
const designTitles = ["URL Shortener", "Ticket Booking System", "Notification System", "Chat System", "Job Scheduler"];
const dsaNames = [
  ["Two Sum", "Arrays & Hashing", "Easy"], ["Valid Anagram", "Arrays & Hashing", "Easy"], ["Group Anagrams", "Arrays & Hashing", "Medium"], ["Top K Frequent Elements", "Heap", "Medium"], ["Valid Palindrome", "Two Pointers", "Easy"], ["3Sum", "Two Pointers", "Medium"], ["Longest Substring Without Repeating Characters", "Sliding Window", "Medium"], ["Minimum Window Substring", "Sliding Window", "Hard"], ["Valid Parentheses", "Stack", "Easy"], ["Daily Temperatures", "Stack", "Medium"], ["Binary Search", "Binary Search", "Easy"], ["Search in Rotated Sorted Array", "Binary Search", "Medium"], ["Reverse Linked List", "Linked List", "Easy"], ["Merge Two Sorted Lists", "Linked List", "Easy"], ["Invert Binary Tree", "Trees", "Easy"], ["Lowest Common Ancestor", "Trees", "Medium"], ["Kth Largest Element", "Heap", "Medium"], ["Subsets", "Backtracking", "Medium"], ["Number of Islands", "Graphs", "Medium"], ["Course Schedule", "Graphs", "Medium"], ["Coin Change", "Dynamic Programming", "Medium"], ["Longest Increasing Subsequence", "Dynamic Programming", "Medium"],
];
const slug = (title: string) => title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const sampleData = (): AppState => {
  const behaviour = [["Tell me about a conflict with a teammate", "Collaboration"], ["Describe a difficult production incident", "Ownership"], ["Tell me about influencing a decision", "Leadership"], ["When did you receive difficult feedback?", "Growth"], ["Describe prioritising competing deadlines", "Delivery"], ["Tell me about a technical mistake", "Accountability"], ["How have you mentored another engineer?", "Leadership"], ["Tell me about dealing with ambiguity", "Problem solving"]];
  const core = [["How do equals and hashCode work together?", "equals and hashCode"], ["What makes an object immutable?", "Immutability"], ["Explain HashMap internals", "Collections"], ["When would you use Optional?", "Exceptions"], ["How do Java generics work?", "Generics"], ["How do streams differ from collections?", "Streams"], ["Explain CompletableFuture", "Concurrency"], ["What lives on the JVM heap?", "JVM memory"], ["How does garbage collection work?", "Garbage collection"], ["How do you test concurrent code?", "Testing"]];
  const spring = [["How does dependency injection work?", "Dependency injection"], ["Explain the bean lifecycle", "Bean lifecycle"], ["How do you manage configuration?", "Configuration"], ["How should REST controllers be structured?", "REST controllers"], ["How do you validate requests?", "Validation"], ["How do you handle API exceptions?", "Exception handling"], ["How does Spring Data derive queries?", "Spring Data"], ["What does @Transactional do?", "Transactions"], ["How do you secure an API?", "Security"], ["How do you test a Spring Boot service?", "Testing"]];
  const learningItems = [
    ...behaviour.map((x, i) => question(`behaviour-${i + 1}`, "BEHAVIOUR", "BEHAVIOUR", x[0], x[1], i === 0 ? "PARTIAL" : i === 1 ? "FAIL" : null, i === 0 ? localDate() : i === 1 ? addDays(-1) : addDays(i + 2))),
    ...core.map((x, i) => question(`java-core-${i + 1}`, "JAVA_THEORY", "CORE_JAVA", x[0], x[1], i === 0 ? "PARTIAL" : null, i === 0 ? localDate() : addDays(i + 3))),
    ...spring.map((x, i) => question(`java-spring-${i + 1}`, "JAVA_THEORY", "SPRING_BOOT", x[0], x[1], null, addDays(i + 3))),
    ...Array.from({ length: 12 }, (_, i) => question(`ddia-${i + 1}-q1`, "DDIA", `CHAPTER_${i + 1}`, `What is the key idea in DDIA chapter ${i + 1}?`, "System design", null, addDays(i + 2))),
  ];
  return {
    version: 1,
    motivationEntries: [["Benefits of changing jobs", "Work on larger-scale distributed systems"], ["Benefits of changing jobs", "Improve compensation and career trajectory"], ["Costs of changing jobs", "Interview preparation takes focused evenings"], ["Benefits of staying", "Keep a familiar team and product context"], ["Costs of staying", "Fewer opportunities to deepen senior-level design skills"]].map((x, i) => ({ id: `motivation-${i}`, section: x[0], text: x[1], order: i })),
    learningItems,
    attempts: [], reviews: [],
    dsa: dsaNames.map((x, i) => ({ id: `dsa-${i + 1}`, title: x[0], category: x[1], difficulty: x[2], leetcodeUrl: `https://leetcode.com/problems/${slug(x[0])}/`, firstSolvedAt: i < 4 ? addDays(-i - 5) : null, initialNotes: "", generalNotes: "", reviews: i < 4 ? [review(`review-${i}-1`, "D1", i === 0 ? -1 : 1), review(`review-${i}-4`, "D4", 4), review(`review-${i}-17`, "D17", 17)] : [] })),
    dailyLogs: [],
    activities: [{ id: "activity-1", date: localDate(), domain: "JAVA_THEORY", itemId: "java-core-1", label: "equals and hashCode practice", result: "PARTIAL", durationMinutes: 8 }, { id: "activity-2", date: addDays(-1), domain: "BEHAVIOUR", itemId: "behaviour-2", label: "Production incident story", result: "FAIL", durationMinutes: 12 }, { id: "activity-3", date: addDays(-2), domain: "FUNCTIONAL_CODING", itemId: "functional-1", label: "Booking API attempted", result: "PARTIAL", durationMinutes: 75 }],
    priorities: [], dismissedAutomaticPriorities: [],
    functionalTasks: functionalTitles.map((title, i) => ({ id: `functional-${i + 1}`, title, category: "Backend exercise", tags: "Java, API, testing", statement: `Design and implement a small ${title}.`, requirements: "Clear HTTP API and business rules.", nonFunctional: "Validation, observability, testability.", entities: "", services: "", repositories: "", api: "", validation: "", errors: "", tests: "", notes: "", link: "", improvement: "", status: i === 0 ? "LEARNING" : "NOT_STARTED", attempts: i === 0 ? [{ id: "fa-1", date: addDays(-2), duration: 75, result: "PARTIAL" as const, notes: "Core path complete; validation needs work." }] : [] })),
    systemDesignTasks: designTitles.map((title, i) => ({ id: `design-${i + 1}`, title, category: "System design", statement: `Design a scalable ${title}.`, notes: "", questions: [], status: i === 0 ? "LEARNING" : "NOT_STARTED", attempts: [] })),
  };
};
