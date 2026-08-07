import type { AppState } from "../types/appState";
import { addDays, localDate } from "../services/readiness/calculations";
import behaviourQuestions from "./questions/behaviour.json";
import javaTheoryCoreQuestions from "./questions/javaTheoryCore.json";
import javaTheorySpringQuestions from "./questions/javaTheorySpring.json";
import ddiaQuestions from "./questions/ddia.json";
import dsaProblems from "./questions/dsa.json";

const question = (
  id: string, domain: any, track: string, title: string, category: string,
  result: any = null, next = addDays(3), last = result ? addDays(-2) : null, keyPoints: string[] = [],
): any => ({ id, domain, track, title, question: title, category, priority: "P1", modelAnswer: `A concise prepared answer for “${title}”. Start with the principle, explain the trade-off, then give a production example.`, personalAnswer: "", notes: "", followUps: "What trade-offs would you discuss?", latestResult: result, lastPractisedAt: last, nextReviewAt: next, keyPoints });
const review = (id: string, stage: any, days: number) => ({ id, stage, dueAt: addDays(days), completed: false, completedAt: null, note: "" });
const functionalTitles = ["Booking API", "Payment Service", "Notification Service", "Inventory Reservation", "Rate Limiter"];
const designTitles = ["Bitly", "Dropbox", "Yelp", "Local Delivery Service", "Ticketmaster", "Instagram", "FB News Feed", "Tinder", "LeetCode", "WhatsApp", "Strava", "Distributed Cache", "Rate Limiter", "Online Auction", "YouTube", "Job Scheduler", "FB Live Comments", "News Aggregator", "Price Tracking Service", "Notification System", "YouTube Top K", "Uber", "Robinhood", "Google Docs", "Web Crawler", "Ad Click Aggregator", "FB Post Search", "Payment System", "Metrics Monitoring", "Online Chess", "ChatGPT"];
const slugOverrides: Record<string, string> = { "Pow(x, n)": "powx-n" };
const slug = (title: string) => slugOverrides[title] || title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const sampleData = (): AppState => {
  const learningItems = [
    ...behaviourQuestions.map((x, i) => question(`behaviour-${i + 1}`, "BEHAVIOUR", "BEHAVIOUR", x.title, x.category, i === 0 ? "PARTIAL" : i === 1 ? "FAIL" : null, i === 0 ? localDate() : i === 1 ? addDays(-1) : addDays(i + 2))),
    ...javaTheoryCoreQuestions.map((x, i) => question(`java-core-${i + 1}`, "JAVA_THEORY", "CORE_JAVA", x.title, x.category, i === 0 ? "PARTIAL" : null, i === 0 ? localDate() : addDays(i + 3), undefined, x.keyPoints)),
    ...javaTheorySpringQuestions.map((x, i) => question(`java-spring-${i + 1}`, "JAVA_THEORY", "SPRING_BOOT", x.title, x.category, null, addDays(i + 3), undefined, x.keyPoints)),
    ...ddiaQuestions.map((x, i) => question(`ddia-${i + 1}-q1`, "DDIA", `CHAPTER_${x.chapter}`, x.title, "System design", null, addDays(i + 2))),
  ];
  return {
    version: 1,
    motivationEntries: [],
    learningItems,
    attempts: [], reviews: [],
    dsa: dsaProblems.map((x, i) => ({ id: `dsa-${i + 1}`, title: x.title, category: x.category, difficulty: x.difficulty, leetcodeUrl: `https://leetcode.com/problems/${slug(x.title)}/`, firstSolvedAt: i < 4 ? addDays(-i - 5) : null, initialNotes: "", generalNotes: "", reviews: i < 4 ? [review(`review-${i}-1`, "D1", i === 0 ? -1 : 1), review(`review-${i}-4`, "D4", 4), review(`review-${i}-17`, "D17", 17)] : [] })),
    dailyLogs: [], weeklyPlanItems: [],
    activities: [{ id: "activity-1", date: localDate(), domain: "JAVA_THEORY", itemId: "java-core-1", label: "equals and hashCode practice", result: "PARTIAL", durationMinutes: 8 }, { id: "activity-2", date: addDays(-1), domain: "BEHAVIOUR", itemId: "behaviour-2", label: "Production incident story", result: "FAIL", durationMinutes: 12 }, { id: "activity-3", date: addDays(-2), domain: "FUNCTIONAL_CODING", itemId: "functional-1", label: "Booking API attempted", result: "PARTIAL", durationMinutes: 75 }],
    priorities: [], dismissedAutomaticPriorities: [],
    functionalTasks: functionalTitles.map((title, i) => ({ id: `functional-${i + 1}`, title, category: "Backend exercise", tags: "Java, API, testing", statement: `Design and implement a small ${title}.`, requirements: "Clear HTTP API and business rules.", nonFunctional: "Validation, observability, testability.", entities: "", services: "", repositories: "", api: "", validation: "", errors: "", tests: "", notes: "", link: "", improvement: "", status: i === 0 ? "LEARNING" : "NOT_STARTED", attempts: i === 0 ? [{ id: "fa-1", date: addDays(-2), duration: 75, result: "PARTIAL" as const, notes: "Core path complete; validation needs work." }] : [] })),
    systemDesignTasks: designTitles.map((title, i) => ({ id: `design-${i + 1}`, title, category: "System design", statement: `Design a scalable ${title}.`, notes: "", questions: [], status: i === 0 ? "LEARNING" : "NOT_STARTED", attempts: [] })),
  };
};
