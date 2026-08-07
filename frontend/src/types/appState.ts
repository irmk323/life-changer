export type Domain = 'BEHAVIOUR'|'JAVA_THEORY'|'DSA'|'FUNCTIONAL_CODING'|'SYSTEM_DESIGN'|'DDIA';
export type LearningResult = 'PASS'|'PARTIAL'|'FAIL'; export type PriorityLevel='HIGH'|'MEDIUM'|'LOW'; export type ReviewStage='D1'|'D4'|'D17';
export type TaskStatus='NOT_STARTED'|'LEARNING'|'RETRY_DUE'|'INTERVIEW_READY'|'IN_PROGRESS';
export interface LearningItem {id:string;domain:Domain;track:string;title:string;question:string;category:string;priority:string;modelAnswer:string;personalAnswer:string;notes:string;followUps:string;latestResult:LearningResult|null;lastPractisedAt:string|null;nextReviewAt:string|null;keyPoints:string[]}
export interface Attempt {id:string;itemId:string;domain:Domain;attemptedAt:string;result:LearningResult;durationMinutes:number;notes:string}
export interface Activity {id:string;date:string;domain:Domain;itemId:string;label:string;result:string;durationMinutes:number}
export interface DsaReview {id:string;stage:ReviewStage;dueAt:string;completed:boolean;completedAt:string|null;note:string}
export interface DsaProblem {id:string;title:string;category:string;difficulty:string;leetcodeUrl:string|null;firstSolvedAt:string|null;initialNotes:string;generalNotes:string;reviews:DsaReview[]}
export interface Priority {id:string;title:string;dueDate:string;priority:PriorityLevel;completed:boolean;order:number;source:'AUTO'|'MANUAL';linkedDomain?:Domain;linkedItemId?:string}
export interface MotivationEntry {id:string;section:string;text:string;order:number}; export interface DailyLog {id:string;date:string;note:string}
export interface WeeklyPlanItem {id:string;date:string;planType:'MAIN'|'SUB';domain:Domain;title:string;plannedMinutes:number;status:TaskStatus;notes:string}
export interface Task {id:string;title:string;category:string;status:TaskStatus;attempts:{id:string;date:string;duration:number;result:LearningResult;notes:string}[];notes?:string;[key:string]:unknown}
export interface ChapterStatus {id:string;status:'NOT_STARTED'|'IN_PROGRESS'|'DONE';notes:string}
export interface AppState {version:number;motivationEntries:MotivationEntry[];learningItems:LearningItem[];attempts:Attempt[];reviews:unknown[];dsa:DsaProblem[];dailyLogs:DailyLog[];weeklyPlanItems:WeeklyPlanItem[];activities:Activity[];priorities:Priority[];dismissedAutomaticPriorities:string[];functionalTasks:Task[];systemDesignTasks:Task[];ddiaChapters:ChapterStatus[]}
