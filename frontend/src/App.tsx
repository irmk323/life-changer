import {
  HashRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { Calendar, Home, BookOpen, Code2, Network, Brain, Pencil, ArrowUp, ArrowDown, AlarmClock, CalendarDays, CheckCircle2, ClipboardList, Flame, GripVertical, Plus, Sparkles, Target, TrendingUp, Trash2, Save, Trophy, Crown } from "lucide-react";
import { useEffect, useRef, useState, type ElementType, type FormEvent } from "react";
import {
  DomainProgress,
  PageHeader,
  QuestionRow,
  Badge,
  StatusPicker,
  STATUS_LABEL,
} from "./components/common";
import { Backup } from "./components/Backup";
import { useAppState } from "./app/AppStateProvider";
import { useAuth } from "./app/AuthProvider";
import { useProfile } from "./app/ProfileGate";
import { useAutosaveField } from "./app/useAutosaveField";
import { getDsaNotes, saveDsaNotes, type DsaNotes } from "./services/firebase/dsaNotesRepository";
import { getDailyLog, saveDailyLog } from "./services/firebase/userEntityRepository";
import { LeaderboardSyncProvider } from "./app/LeaderboardSyncProvider";
import { subscribeAllProgress, type StoredLeaderboardProgress } from "./services/firebase/leaderboardProgressRepository";
import { subscribeAllProfiles } from "./services/firebase/profile";
import { subscribeRecentActivities, type StoredLeaderboardActivity } from "./services/firebase/leaderboardActivityRepository";
import { ErrorBoundary } from "./app/ErrorBoundary";
import {
  dueState,
  progress,
  streak,
  suggested,
  localDate,
  addDays,
} from "./services/readiness/calculations";
const nav = [
  ["/dashboard", "Dashboard", Home],
  ["/motivation", "Decision Balance", Brain],
  ["/weekly-plan", "Weekly Plan", CalendarDays],
  ["/calendar", "Calendar", Calendar],
  ["/behaviour", "Behaviour", BookOpen],
  ["/java", "Java Theory", BookOpen],
  ["/dsa", "DSA", Code2],
  ["/functional-coding", "Practical Coding", Code2],
  ["/system-design", "System Design", Network],
  ["/backup", "Backup", Save],
  ["/leaderboard", "Leaderboard", Trophy],
] as const;
const DOMAIN_LABELS: Record<string, string> = { DSA: "DSA", JAVA_THEORY: "Java Theory", BEHAVIOUR: "Behaviour", FUNCTIONAL_CODING: "Practical Coding", SYSTEM_DESIGN: "System Design", DDIA: "DDIA" };
const DDIA_CHAPTERS = [
  "Reliable, scalable, maintainable applications",
  "Data models and query languages",
  "Storage and retrieval",
  "Encoding and evolution",
  "Replication",
  "Partitioning",
  "Transactions",
  "Distributed systems",
  "Consistency and consensus",
  "Batch processing",
  "Stream processing",
  "The future of data systems",
];
const LEADERBOARD_DOMAINS = [
  { key: "DDIA", label: "DDIA", icon: BookOpen, unit: "chapters" },
  { key: "HELLO_INTERVIEW", label: "Hello Interview", icon: Network, unit: "exercises" },
  { key: "DSA", label: "DSA", icon: Code2, unit: "problems" },
] as const;
function Shell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#203334]">
      <aside className="fixed hidden h-screen w-60 bg-[#183d3a] p-4 text-[#e8f2ef] md:block">
        <h1 className="mb-2 text-xl font-bold">
          Life <span className="text-[#9bd0c3]">Changer</span>
        </h1>
        <p className="mb-8 text-xs text-[#a8c1bc]">Interview preparation</p>
        {nav.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-2 rounded px-3 py-2 ${isActive ? "bg-[#2a5d57] font-semibold text-white" : "text-[#dce9e6] hover:bg-[#24514c] hover:text-white"}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        {user && (
          <div className="mt-4 mb-2 rounded border border-[#6f9790] px-3 py-2 text-xs text-[#dce9e6]">
            <p className="truncate">Signed in as {user.displayName || user.email}</p>
            <button className="mt-1 underline hover:text-white" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        )}
      </aside>
      <main className="mx-auto max-w-[1500px] p-4 md:ml-60 md:p-8">{children}</main>
    </div>
  );
}
const domain = (state: any, name: string, key: string) => {
  const taskItems = key === "FUNCTIONAL_CODING" ? state.functionalTasks : key === "SYSTEM_DESIGN" ? state.systemDesignTasks : null;
  const items = key === "DSA" ? state.dsa : taskItems || state.learningItems.filter((x: any) => x.domain === key);
  const x = taskItems
    ? { done: taskItems.filter((item: any) => item.status === "INTERVIEW_READY").length, total: taskItems.length, percentage: taskItems.length ? Math.round(taskItems.filter((item: any) => item.status === "INTERVIEW_READY").length / taskItems.length * 100) : 0 }
    : progress(items, key === "DSA");
  return <DomainProgress name={name} {...x} />;
};
function Dashboard() {
  const { state, dispatch } = useAppState(),
    s = streak(state.activities),
    [text, setText] = useState(""),
    [edit, setEdit] = useState<any | null>(null);
  const newPriorityInput = useRef<HTMLInputElement>(null);
  const dueToday = state.learningItems.filter((x: any) => x.nextReviewAt === localDate()).length;
  const overdue = state.learningItems.filter((x: any) => x.nextReviewAt && x.nextReviewAt < localDate()).length;
  const readiness = progress(state.learningItems).percentage;
  const priorities = [
    ...state.priorities,
    ...suggested(state).map((x: any, index: number) => ({
      id: `auto-${x.id}`,
      title: x.title,
      dueDate: x.nextReviewAt,
      priority: "HIGH",
      completed: false,
      source: "AUTO",
      order: state.priorities.length + index,
      linkedDomain: x.domain,
    })),
  ].sort((a: any, b: any) => a.order - b.order);
  const upsert = (item: any) =>
    dispatch({ type: "UPSERT", payload: { collection: "priorities", item } });
  const manualPriority = (item: any) => ({ ...item, id: crypto.randomUUID(), source: "MANUAL", order: state.priorities.length });
  const persistPriority = (item: any) => {
    if (item.source === "AUTO") {
      dispatch({ type: "DISMISS_AUTO", payload: item.id.replace("auto-", "") });
      upsert(manualPriority(item));
      return;
    }
    upsert(item);
  };
  const movePriority = (item: any, direction: -1 | 1) => {
    const target = item.source === "AUTO" ? manualPriority(item) : item;
    if (item.source === "AUTO") {
      dispatch({ type: "DISMISS_AUTO", payload: item.id.replace("auto-", "") });
      upsert(target);
    }
    dispatch({ type: "PRIORITY_REORDER", payload: { id: target.id, direction } });
  };
  const priorityDomain = (p: any) => {
    if (p.linkedDomain) return DOMAIN_LABELS[p.linkedDomain] || p.linkedDomain;
    const value = String(p.title).toLowerCase();
    if (value.includes("design") || value.includes("url")) return "System Design";
    if (value.includes("java")) return "Java Theory";
    if (value.includes("tree") || value.includes("array") || value.includes("dsa")) return "DSA";
    return "Focus";
  };
  const activityIcon = (domain: string) =>
    domain === "DSA" ? <Code2 size={15} /> : domain === "BEHAVIOUR" ? <Sparkles size={15} /> : <BookOpen size={15} />;
  const statCards: Array<{ label: string; value: string | number; Icon: ElementType; description: string }> = [
    { label: "Overall readiness", value: `${readiness}%`, Icon: Target, description: "Your interview preparation progress" },
    { label: "Reviews due today", value: dueToday, Icon: ClipboardList, description: dueToday ? "Keep the review loop moving" : "All caught up for today" },
    { label: "Overdue reviews", value: overdue, Icon: AlarmClock, description: overdue ? "Clear these first" : "Nothing is waiting" },
    { label: "Weekly sessions", value: state.activities.length, Icon: CalendarDays, description: "Goal: 6 focused sessions" },
    { label: "Retention", value: "Coming soon", Icon: TrendingUp, description: "Track this as you practise" },
    { label: "Study streak", value: `${s.current} days`, Icon: Flame, description: `Longest: ${s.longest} days` },
  ];
  return (
    <>
      <header className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Your daily command center to prepare for your next role.</p>
        </div>
        <button className="dashboard-primary" onClick={() => newPriorityInput.current?.focus()}>
          <Plus size={17} /> Add priority
        </button>
      </header>
      <div className="dashboard-stats">
        {statCards.map(({ label, value, Icon, description }) => (
          <section className="dashboard-stat" key={label}>
            <span className="dashboard-stat__icon"><Icon size={27} strokeWidth={1.7} /></span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
              <small>{description}</small>
            </div>
          </section>
        ))}
      </div>
      <div className="dashboard-main-grid">
        <section className="dashboard-panel priority-panel">
          <div className="dashboard-panel__heading">
            <div>
              <h2>Today’s priorities</h2>
              <p>Focus on what moves the needle. Reorder and edit as needed.</p>
            </div>
            <span className="dashboard-panel__hint"><Sparkles size={15} /> Auto-suggested</span>
          </div>
          {priorities.map((p: any) =>
            edit?.id === p.id ? (
              <form
                className="flex flex-wrap gap-2 border-t py-2"
                key={p.id}
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  persistPriority({
                    ...p,
                    title: String(f.get("title")),
                    dueDate: String(f.get("dueDate")),
                    priority: String(f.get("priority")),
                    linkedDomain: String(f.get("linkedDomain")),
                  });
                  setEdit(null);
                }}
              >
                <input name="title" defaultValue={p.title} />
                <input name="dueDate" type="date" defaultValue={p.dueDate} />
                <select name="priority" defaultValue={p.priority}>
                  <option>HIGH</option>
                  <option>MEDIUM</option>
                  <option>LOW</option>
                </select>
                <select name="linkedDomain" defaultValue={p.linkedDomain || Object.keys(DOMAIN_LABELS)[0]}>
                  {Object.entries(DOMAIN_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
                <button>Save</button>
                <button type="button" onClick={() => setEdit(null)}>
                  Cancel
                </button>
                <button
                  className="text-[#923d36]"
                  type="button"
                    onClick={() => {
                      if (confirm(`Delete ${p.title}?`)) {
                      if (p.source === "AUTO") {
                        dispatch({ type: "DISMISS_AUTO", payload: p.id.replace("auto-", "") });
                      } else {
                        dispatch({ type: "DELETE", payload: { collection: "priorities", id: p.id } });
                      }
                      setEdit(null);
                    }
                  }}
                >
                  Delete task
                </button>
              </form>
            ) : (
              <div className={`priority-row ${p.completed ? "priority-row--completed" : ""}`} key={p.id}>
                <input
                  type="checkbox"
                  checked={p.completed}
                  onChange={(e) => persistPriority({ ...p, completed: e.target.checked })}
                />
                <span className="priority-row__title">
                  {p.title}
                </span>
                <span className="priority-row__date"><Calendar size={16} /> {p.dueDate === localDate() ? "Today" : p.dueDate}</span>
                <span className="priority-row__domain">{priorityDomain(p)}</span>
                <Badge>{p.priority}</Badge>
                <button className="icon-button" aria-label={`Edit ${p.title}`} title="Edit" onClick={() => setEdit(p)}><Pencil size={15} /></button>
                <span className="priority-row__move">
                  <button className="icon-button" aria-label={`Move ${p.title} up`} title="Move up" onClick={() => movePriority(p, -1)}><ArrowUp size={14} /></button>
                  <button className="icon-button" aria-label={`Move ${p.title} down`} title="Move down" onClick={() => movePriority(p, 1)}><ArrowDown size={14} /></button>
                  <GripVertical size={16} aria-hidden="true" />
                </span>
              </div>
            ),
          )}
          <form
            className="dashboard-add-priority"
            onSubmit={(e) => {
              e.preventDefault();
              if (text) {
                const linkedDomain = String(new FormData(e.currentTarget).get("linkedDomain"));
                upsert({
                  id: crypto.randomUUID(), title: text, dueDate: localDate(),
                  priority: "MEDIUM", completed: false, source: "MANUAL",
                  order: state.priorities.length,
                  linkedDomain,
                });
                setText("");
              }
            }}
          >
            <input ref={newPriorityInput} value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded border p-2" aria-label="New priority" placeholder="Add a priority" />
            <select name="linkedDomain" defaultValue={Object.keys(DOMAIN_LABELS)[0]} aria-label="Category">
              {Object.entries(DOMAIN_LABELS).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
            <button className="dashboard-primary"><Plus size={16} /> Add priority</button>
          </form>
        </section>
        <section className="dashboard-panel domain-panel">
          <div className="dashboard-panel__heading">
            <div><h2>Domain progress</h2><p>Your progress by key interview domains.</p></div>
          </div>
          {[
            ["Behaviour", "BEHAVIOUR"],
            ["Java Theory", "JAVA_THEORY"],
            ["DSA", "DSA"],
            ["Practical Coding", "FUNCTIONAL_CODING"],
            ["DDIA", "DDIA"],
            ["Hello Interview", "SYSTEM_DESIGN"],
          ].map(([label, x]) => {
            const taskItems = x === "FUNCTIONAL_CODING" ? state.functionalTasks : x === "SYSTEM_DESIGN" ? state.systemDesignTasks : null;
            const ddiaDone = DDIA_CHAPTERS.filter((_, index) => state.ddiaChapters.find((c: any) => c.id === `CHAPTER_${index + 1}`)?.status === "DONE").length;
            const p = x === "DDIA"
              ? { done: ddiaDone, total: DDIA_CHAPTERS.length, percentage: Math.round((ddiaDone / DDIA_CHAPTERS.length) * 100) }
              : taskItems
                ? { done: taskItems.filter((item: any) => item.status === "INTERVIEW_READY").length, total: taskItems.length, percentage: taskItems.length ? Math.round(taskItems.filter((item: any) => item.status === "INTERVIEW_READY").length / taskItems.length * 100) : 0 }
                : progress(x === "DSA" ? state.dsa : state.learningItems.filter((i: any) => i.domain === x), x === "DSA");
            return (
              <div className="domain-progress-row" key={x}>
                <div>
                  <span>{label}</span>
                  <strong>{p.percentage}%</strong>
                </div>
                <div className="mt-1 h-2 rounded bg-[#d9e3e0]">
                  <div
                    className="h-2 rounded bg-[#21675d]"
                    style={{ width: `${p.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          <Link to="/behaviour" className="dashboard-secondary">View all domains</Link>
        </section>
      </div>
      <section className="dashboard-panel dashboard-activity">
        <div className="dashboard-panel__heading"><div><h2>Recent activity</h2><p>Latest actions and results across your preparation.</p></div></div>
        {state.activities.length === 0 ? (
          <p className="text-[#657777]">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-[#657777]">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Domain</th>
                  <th className="p-2">Item</th>
                  <th className="p-2">Result</th>
                  <th className="p-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {state.activities
                  .slice()
                  .sort((a: any, b: any) => b.date.localeCompare(a.date))
                  .slice(0, 5)
                  .map((activity: any) => (
                    <tr key={activity.id}>
                      <td className="dashboard-activity__date"><span>{activityIcon(activity.domain)}</span>{activity.date}</td>
                      <td className="p-2">
                        {activity.domain.replaceAll("_", " ")}
                      </td>
                      <td className="p-2">{activity.label}</td>
                      <td className="p-2">
                        <span className="dashboard-result"><CheckCircle2 size={15} /><Badge>{activity.result}</Badge></span>
                      </td>
                      <td className="p-2">
                        {activity.durationMinutes
                          ? `${activity.durationMinutes} min`
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        <Link to="/calendar" className="dashboard-secondary">View all activity</Link>
      </section>
    </>
  );
}
function Questions({ kind }: { kind: "BEHAVIOUR" | "JAVA_THEORY" | "DDIA" }) {
  const { state, dispatch } = useAppState();
  const { chapterId } = useParams();
  const nav = useNavigate();
  const [tab, setTab] = useState("CORE_JAVA"),
    [text, setText] = useState("");
  const items = state.learningItems.filter(
    (x: any) =>
      x.domain === kind &&
      (kind !== "JAVA_THEORY" || x.track === tab) &&
      (kind !== "DDIA" || x.track === `CHAPTER_${chapterId || "1"}`),
  );
  const title =
    kind === "JAVA_THEORY"
      ? "Java Theory"
      : kind === "DDIA"
        ? "DDIA"
        : "Behaviour";
  const chapterKey = kind === "DDIA" ? `CHAPTER_${chapterId || "1"}` : null;
  const chapterRecord = chapterKey ? state.ddiaChapters.find((c: any) => c.id === chapterKey) : null;
  const saveChapter = (patch: any) => {
    if (!chapterKey) return;
    const wasNotDone = chapterRecord?.status !== "DONE";
    dispatch({ type: "UPSERT", payload: { collection: "ddiaChapters", item: { id: chapterKey, ...patch } } });
    if (patch.status === "DONE" && wasNotDone) {
      const today = localDate();
      dispatch({ type: "UPSERT", payload: { collection: "activities", item: { id: `activity-ddia-${chapterKey}-${today}`, date: today, domain: "DDIA", itemId: chapterKey, label: `DDIA Chapter ${chapterKey.replace("CHAPTER_", "")}`, result: "PASS", durationMinutes: 0 } } });
    }
  };
  return (
    <>
      {kind === "DDIA" && <button className="mb-3" onClick={() => nav("/system-design")}>← Back</button>}
      <PageHeader title={title} />
      {kind !== "DDIA" && domain(state, title, kind)}
      {kind === "DDIA" && (
        <StatusPicker
          title="Have you read this chapter?"
          value={chapterRecord?.status || "NOT_STARTED"}
          options={["NOT_STARTED", "IN_PROGRESS", "DONE"]}
          onChange={(status) => saveChapter({ status })}
        />
      )}
      {kind === "JAVA_THEORY" && (
        <div className="app-tabs mb-3" role="tablist" aria-label="Java topic">
          <button className={`app-tab ${tab === "CORE_JAVA" ? "app-tab--active" : ""}`} role="tab" aria-selected={tab === "CORE_JAVA"} onClick={() => setTab("CORE_JAVA")}>Core Java</button>
          <button className={`app-tab ${tab === "SPRING_BOOT" ? "app-tab--active" : ""}`} role="tab" aria-selected={tab === "SPRING_BOOT"} onClick={() => setTab("SPRING_BOOT")}>Spring Boot</button>
        </div>
      )}
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text) {
            dispatch({
              type: "UPSERT",
              payload: {
                collection: "learningItems",
                item: {
                  id: crypto.randomUUID(),
                  domain: kind,
                  track:
                    kind === "JAVA_THEORY"
                      ? tab
                      : kind === "DDIA"
                        ? `CHAPTER_${chapterId || "1"}`
                        : "BEHAVIOUR",
                  title: text,
                  question: text,
                  category: "General",
                  priority: "P1",
                  modelAnswer: "",
                  personalAnswer: "",
                  notes: "",
                  followUps: "",
                  latestResult: null,
                  lastPractisedAt: null,
                  nextReviewAt: null,
                  keyPoints: [],
                },
              },
            });
            setText("");
          }
        }}
      >
        <input
          required
          className="flex-1 rounded border p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New interview question"
        />
        <button className="rounded bg-teal-700 px-3 text-white">
          Add question
        </button>
      </form>
      <div className="question-list grid gap-0">
        {items.map((x: any) => (
          <QuestionRow key={x.id} item={x} java={kind === "JAVA_THEORY"} />
        ))}
      </div>
      {kind === "DDIA" && (
        <section className="lc-panel mt-4 rounded-xl border bg-white p-4">
          <h2 className="font-bold">Learning notes</h2>
          <p className="mb-2 text-sm text-[#657777]">Key takeaways and things to revisit from this chapter.</p>
          <DdiaChapterNotesField key={chapterKey} initialValue={chapterRecord?.notes || ""} onSave={(value) => saveChapter({ notes: value })} />
        </section>
      )}
    </>
  );
}
// Keyed by chapterKey at the call site so switching DDIA chapters (a route param change
// that does not remount Questions) gets a fresh useAutosaveField instance instead of
// reusing the previous chapter's stale value/timer — see DsaNotesFieldsLoaded for the same
// "hook state must be re-mounted, not just re-rendered" principle.
function DdiaChapterNotesField({ initialValue, onSave }: { initialValue: string; onSave: (value: string) => void }) {
  const chapterNotes = useAutosaveField(initialValue, onSave);
  return (
    <textarea
      className="min-h-40 w-full rounded border p-2"
      value={chapterNotes.value}
      placeholder="What stood out in this chapter?"
      onChange={(e) => chapterNotes.onChange(e.target.value)}
      onBlur={chapterNotes.onBlur}
    />
  );
}
function FirstSolvedCell({ p, dispatch }: { p: any; dispatch: any }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const markSolved = (value: string) => {
    if (!value) return;
    const isFirstSolve = !p.firstSolvedAt;
    const reviews =
      p.reviews && p.reviews.length > 0
        ? p.reviews
        : (["D1", "D4", "D17"] as const).map((stage) => ({
            id: `${p.id}-${stage.toLowerCase()}`,
            stage,
            dueAt: addDays(stage === "D1" ? 1 : stage === "D4" ? 4 : 17, value),
            completed: false,
            completedAt: null,
            note: "",
          }));
    dispatch({ type: "DSA_UPDATE", payload: { ...p, firstSolvedAt: value, reviews } });
    if (isFirstSolve) {
      dispatch({ type: "UPSERT", payload: { collection: "activities", item: { id: `activity-${p.id}-solved-${value}`, date: value, domain: "DSA", itemId: p.id, label: p.title, result: "PASS", durationMinutes: 0 } } });
    }
  };
  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof (el as any).showPicker === "function") (el as any).showPicker();
    else el.focus();
  };
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        className="table-link link-button whitespace-nowrap text-sm"
        onClick={openPicker}
      >
        {p.firstSolvedAt || "Mark as solved"}
      </button>
      <input
        ref={inputRef}
        type="date"
        value={p.firstSolvedAt || ""}
        onChange={(e) => markSolved(e.target.value)}
        className="sr-only"
        aria-label="First solved date"
      />
    </div>
  );
}
function Dsa() {
  const { state, dispatch } = useAppState();
  return (
    <>
      <PageHeader title="DSA" />
      {domain(state, "DSA", "DSA")}
      <div className="lc-panel rounded-xl border bg-white p-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed text-left">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[9rem]" />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Problem</th>
                <th className="whitespace-nowrap pr-8 text-right">First solved</th>
                <th>D+1</th>
                <th>D+4</th>
                <th>D+17</th>
              </tr>
            </thead>
            <tbody>
              {state.dsa.map((p: any) => (
                <tr className="border-t" key={p.id}>
                  <td>
                    <Link className="table-link" to={`/dsa/${p.id}`}>
                      {p.title}
                    </Link>
                    <a
                      className="ml-2 text-sm underline"
                      href={p.leetcodeUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LeetCode ↗
                    </a>
                  </td>
                  <td className="whitespace-nowrap pr-8 text-right">
                    <FirstSolvedCell p={p} dispatch={dispatch} />
                  </td>
                  {(["D1", "D4", "D17"] as const).map((stage) => {
                    const r = p.reviews.find((x: any) => x.stage === stage);
                    if (!r) {
                      return <td className="p-2 text-[#657777]" key={stage}>—</td>;
                    }
                    const [stateLabel, label] = dueState(r.dueAt, r.completed);
                    return (
                      <td
                        key={stage}
                        className={`dsa-review dsa-review--${stateLabel.toLowerCase()}`}
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={r.completed}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const today = localDate();
                              dispatch({
                                type: "DSA_UPDATE",
                                payload: {
                                  ...p,
                                  reviews: p.reviews.map((x: any) =>
                                    x.stage === stage
                                      ? {
                                          ...x,
                                          completed: e.target.checked,
                                          completedAt: e.target.checked
                                            ? today
                                            : null,
                                        }
                                      : x,
                                  ),
                                },
                              });
                              if (e.target.checked) {
                                dispatch({ type: "UPSERT", payload: { collection: "activities", item: { id: `activity-${p.id}-${stage}-${today}`, date: today, domain: "DSA", itemId: p.id, label: `${p.title} (${stage} review)`, result: "PASS", durationMinutes: 0 } } });
                              }
                            }}
                          />{" "}
                          {stage}
                        </label>
                        <small className="block">
                          {r.dueAt} · {label}
                        </small>
                        <Link
                          className="table-link text-sm"
                          to={`/dsa/${p.id}`}
                        >
                          Notes
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
function DsaNotesFields({ problemId, stages }: { problemId: string; stages: string[] }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<DsaNotes | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getDsaNotes(user.uid, problemId).then((result) => {
      // Always fill in every field with a default, not just when the whole document is
      // missing: saveDsaNotes only writes reviewNotes when a review stage was actually
      // edited, so an existing document can legitimately have initialNotes but no
      // reviewNotes at all. Reading notes.reviewNotes[stage] below would otherwise throw
      // once the problem is marked solved (stages becomes non-empty) with a partial doc.
      if (!cancelled) {
        setNotes({
          initialNotes: result?.initialNotes ?? "",
          generalNotes: result?.generalNotes ?? "",
          reviewNotes: { D1: result?.reviewNotes?.D1 ?? "", D4: result?.reviewNotes?.D4 ?? "", D17: result?.reviewNotes?.D17 ?? "" },
          updatedAt: result?.updatedAt ?? "",
        });
      }
    });
    return () => { cancelled = true; };
  }, [user, problemId]);

  const save = (patch: Parameters<typeof saveDsaNotes>[2]) => { if (user) void saveDsaNotes(user.uid, problemId, patch); };

  if (!notes) return <p className="mt-4 text-sm text-[#657777]">Loading notes…</p>;

  return (
    <DsaNotesFieldsLoaded notes={notes} stages={stages} save={save} />
  );
}
// Only mounted once `notes` has actually loaded from Firestore — useAutosaveField's
// internal useState(initialValue) only honors the value on this component's first render,
// so mounting it earlier (while notes is still null) would permanently lock the fields to
// an empty string even after the real value arrives.
function DsaNotesFieldsLoaded({ notes, stages, save }: { notes: DsaNotes; stages: string[]; save: (patch: Parameters<typeof saveDsaNotes>[2]) => void }) {
  const initialNotesField = useAutosaveField(notes.initialNotes, (value) => save({ initialNotes: value }));
  const generalNotesField = useAutosaveField(notes.generalNotes, (value) => save({ generalNotes: value }));

  return (
    <>
      <label>
        Initial solve notes
        <textarea
          value={initialNotesField.value}
          onChange={(e) => initialNotesField.onChange(e.target.value)}
          onBlur={initialNotesField.onBlur}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      {stages.map((stage) => (
        <DsaReviewNoteField key={stage} stage={stage} initialValue={notes.reviewNotes[stage as keyof DsaNotes["reviewNotes"]] ?? ""} onSave={(value) => save({ reviewNotes: { [stage]: value } })} />
      ))}
      <label className="mt-3 block">
        General notes
        <textarea
          value={generalNotesField.value}
          onChange={(e) => generalNotesField.onChange(e.target.value)}
          onBlur={generalNotesField.onBlur}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
    </>
  );
}
function DsaReviewNoteField({ stage, initialValue, onSave }: { stage: string; initialValue: string; onSave: (value: string) => void }) {
  const field = useAutosaveField(initialValue, onSave);
  return (
    <label className="mt-3 block">
      {stage} review note
      <textarea value={field.value} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} className="mt-1 w-full rounded border p-2" />
    </label>
  );
}
function DsaDetail() {
  const { id = "" } = useParams(),
    { state } = useAppState(),
    nav = useNavigate();
  const p = state.dsa.find((x: any) => x.id === id);
  if (!p) return <Navigate to="/dsa" />;
  return (
    <>
      <button className="mb-3" onClick={() => nav("/dsa")}>← Back</button>
      <PageHeader title={p.title} />
      <a
        href={p.leetcodeUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Open in LeetCode ↗
      </a>
      <section className="mt-4 rounded-xl border bg-white p-4">
        <DsaNotesFields key={id} problemId={id} stages={p.reviews.map((r: any) => r.stage)} />
      </section>
    </>
  );
}
function WeeklyPlan() {
  const { state, dispatch } = useAppState();
  const weekStart = (date: string) => {
    const value = new Date(`${date}T12:00:00`);
    value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
    return value.toLocaleDateString("en-CA");
  };
  const [activeWeek, setActiveWeek] = useState(() => weekStart(localDate()));
  const [editor, setEditor] = useState<any | null>(null);
  const days = Array.from({ length: 7 }, (_, index) => addDays(index, activeWeek));
  const weekItems = state.weeklyPlanItems.filter((item: any) => item.date >= activeWeek && item.date <= days[6]);
  const completed = weekItems.filter((item: any) => item.status === "INTERVIEW_READY").length;
  const plannedMinutes = weekItems.reduce((total: number, item: any) => total + Number(item.plannedMinutes || 0), 0);
  const domainLabels = DOMAIN_LABELS;
  const openNew = (date = activeWeek, planType = "MAIN") => setEditor({ id: "", date, planType, domain: "DSA", title: "", plannedMinutes: 60, status: "NOT_STARTED", notes: "" });
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    dispatch({ type: "UPSERT", payload: { collection: "weeklyPlanItems", item: { ...editor, id: editor.id || crypto.randomUUID(), date: String(values.get("date")), planType: String(values.get("planType")), domain: String(values.get("domain")), title: String(values.get("title")).trim(), plannedMinutes: Number(values.get("plannedMinutes")), status: editor.status || "NOT_STARTED", notes: String(values.get("notes")).trim() } } });
    setEditor(null);
  };
  const formatDay = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return <>
    <PageHeader title="Weekly Plan" />
    <p className="mb-4 text-slate-600">Plan focused study blocks for the week, then update or remove them as your priorities change.</p>
    <section className="lc-panel mb-4 rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><button onClick={() => setActiveWeek(addDays(-7, activeWeek))}>← Previous</button><strong>{formatDay(activeWeek)} – {formatDay(days[6])}</strong><button onClick={() => setActiveWeek(addDays(7, activeWeek))}>Next →</button></div>
        <button onClick={() => setActiveWeek(weekStart(localDate()))}>This week</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-[#f0f5f3] p-3"><span className="block text-sm text-[#657777]">Planned sessions</span><strong className="text-2xl">{weekItems.length}</strong></div>
        <div className="rounded-lg bg-[#f0f5f3] p-3"><span className="block text-sm text-[#657777]">Planned time</span><strong className="text-2xl">{plannedMinutes ? `${Math.floor(plannedMinutes / 60)}h ${plannedMinutes % 60}m` : "0h"}</strong></div>
        <div className="rounded-lg bg-[#f0f5f3] p-3"><span className="block text-sm text-[#657777]">Completed</span><strong className="text-2xl">{completed} / {weekItems.length}</strong></div>
      </div>
    </section>
    {editor && <section className="lc-panel mb-4 rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">{editor.id ? "Edit study item" : "Add study item"}</h2><button onClick={() => setEditor(null)}>Cancel</button></div>
      <form key={editor.id || editor.date} className="grid gap-3 md:grid-cols-2" onSubmit={save}>
        <label className="grid gap-1 font-semibold">Date<input name="date" type="date" defaultValue={editor.date} required /></label>
        <label className="grid gap-1 font-semibold">Plan type<select name="planType" value={editor.planType} onChange={(event) => setEditor({ ...editor, planType: event.target.value })}><option value="MAIN">Main subject</option><option value="SUB">Secondary subject</option></select></label>
        <label className="grid gap-1 font-semibold">Study area<select name="domain" defaultValue={editor.domain}>{Object.entries(domainLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label className="grid gap-1 font-semibold md:col-span-2">Study item<input name="title" defaultValue={editor.title} placeholder="e.g. Solve two sliding-window problems" required /></label>
        <label className="grid gap-1 font-semibold">Planned minutes<input name="plannedMinutes" type="number" min="5" step="5" defaultValue={editor.plannedMinutes} required /></label>
        <label className="grid gap-1 font-semibold md:col-span-2">Note <span className="font-normal text-[#657777]">(optional)</span><textarea name="notes" defaultValue={editor.notes} placeholder="What do you want to focus on?" /></label>
        <div className="flex gap-2 md:col-span-2"><button className="bg-[#21675d] text-white">Save item</button><button type="button" onClick={() => setEditor(null)}>Cancel</button></div>
      </form>
    </section>}
    <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
      {days.map((date) => {
        const items = weekItems.filter((item: any) => item.date === date);
        const mainItems = items.filter((item: any) => item.planType !== "SUB");
        const subItems = items.filter((item: any) => item.planType === "SUB");
        return <article className="lc-panel min-w-0 rounded-xl border bg-white p-3" key={date}>
          <h2 className="mb-3 font-bold">{formatDay(date)}</h2>
          <div className="grid gap-3">
            <section><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-[#657777]">Main subject</h3><button className="icon-button" aria-label={`Add main subject for ${date}`} title="Add main subject" onClick={() => openNew(date, "MAIN")}><Plus size={15} /></button></div>
              <div className="grid gap-2">{mainItems.map((item: any) => <div className={`rounded-lg border border-[#d9e3e0] p-3 ${item.status === "INTERVIEW_READY" ? "bg-[#f1f3f2] text-[#657777]" : ""}`} key={item.id}>
            <div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-[#21675d]">{domainLabels[item.domain]}</span><input aria-label={`Mark ${item.title} as completed`} type="checkbox" checked={item.status === "INTERVIEW_READY"} onChange={(event) => dispatch({ type: "UPSERT", payload: { collection: "weeklyPlanItems", item: { ...item, status: event.target.checked ? "INTERVIEW_READY" : "NOT_STARTED" } } })} /></div>
            <h3 className={`mt-2 font-semibold ${item.status === "INTERVIEW_READY" ? "line-through" : ""}`}>{item.title}</h3><p className="mt-1 text-sm text-[#657777]">{item.plannedMinutes} min</p>{item.notes && <p className="mt-2 text-sm text-[#657777]">{item.notes}</p>}
            <div className="mt-3 flex gap-2"><button className="icon-button" aria-label={`Edit ${item.title}`} title="Edit" onClick={() => setEditor(item)}><Pencil size={15} /></button><button className="icon-button text-[#923d36]" aria-label={`Delete ${item.title}`} title="Delete" onClick={() => confirm("Delete this study item?") && dispatch({ type: "DELETE", payload: { collection: "weeklyPlanItems", id: item.id } })}><Trash2 size={15} /></button></div>
          </div>)}{mainItems.length === 0 && <p className="rounded-lg bg-[#f0f5f3] p-3 text-sm text-[#657777]">No main subject planned.</p>}</div></section>
            <section><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-[#657777]">Secondary subjects</h3><button className="icon-button" aria-label={`Add secondary subject for ${date}`} title="Add secondary subject" onClick={() => openNew(date, "SUB")}><Plus size={15} /></button></div>
              <div className="grid gap-2">{subItems.map((item: any) => <div className={`rounded-lg border border-[#d9e3e0] p-3 ${item.status === "INTERVIEW_READY" ? "bg-[#f1f3f2] text-[#657777]" : ""}`} key={item.id}>
                <div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-[#21675d]">{domainLabels[item.domain]}</span><input aria-label={`Mark ${item.title} as completed`} type="checkbox" checked={item.status === "INTERVIEW_READY"} onChange={(event) => dispatch({ type: "UPSERT", payload: { collection: "weeklyPlanItems", item: { ...item, status: event.target.checked ? "INTERVIEW_READY" : "NOT_STARTED" } } })} /></div>
                <h3 className={`mt-2 font-semibold ${item.status === "INTERVIEW_READY" ? "line-through" : ""}`}>{item.title}</h3><p className="mt-1 text-sm text-[#657777]">{item.plannedMinutes} min</p>{item.notes && <p className="mt-2 text-sm text-[#657777]">{item.notes}</p>}
                <div className="mt-3 flex gap-2"><button className="icon-button" aria-label={`Edit ${item.title}`} title="Edit" onClick={() => setEditor(item)}><Pencil size={15} /></button><button className="icon-button text-[#923d36]" aria-label={`Delete ${item.title}`} title="Delete" onClick={() => confirm("Delete this study item?") && dispatch({ type: "DELETE", payload: { collection: "weeklyPlanItems", id: item.id } })}><Trash2 size={15} /></button></div>
              </div>)}{subItems.length === 0 && <p className="rounded-lg bg-[#f0f5f3] p-3 text-sm text-[#657777]">No secondary subjects planned.</p>}</div></section>
          </div>
        </article>;
      })}
    </section>
  </>;
}
function DailyNoteField({ day }: { day: string }) {
  const { user } = useAuth();
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getDailyLog(user.uid, day).then((result) => { if (!cancelled) setNote(result?.note ?? ""); });
    return () => { cancelled = true; };
  }, [user, day]);
  if (note === null) return <p className="mt-2 text-sm text-[#657777]">Loading…</p>;
  return <DailyNoteFieldLoaded note={note} onSave={(value) => { if (user) void saveDailyLog(user.uid, day, value); }} />;
}
// Only mounted once `note` has actually loaded — see DsaNotesFieldsLoaded for why.
function DailyNoteFieldLoaded({ note, onSave }: { note: string; onSave: (value: string) => void }) {
  const field = useAutosaveField(note, onSave);
  return (
    <textarea
      value={field.value}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      placeholder="What felt clear? What needs repair?"
      className="mt-2 min-h-36 w-full rounded border p-2"
    />
  );
}
function CalendarPage() {
  const { state } = useAppState(),
    [day, setDay] = useState(localDate()),
    [month, setMonth] = useState(() => new Date());
  const first = new Date(month.getFullYear(), month.getMonth(), 1),
    start = new Date(first);
  start.setDate(1 - first.getDay());
  const colours: any = {
    DSA: "bg-blue-600",
    SYSTEM_DESIGN: "bg-red-600",
    BEHAVIOUR: "bg-purple-600",
    JAVA_THEORY: "bg-green-600",
    FUNCTIONAL_CODING: "bg-orange-500",
  };
  return (
    <>
      <PageHeader title="Calendar" />
      <p className="mb-3 flex flex-wrap gap-3 text-sm">
        <span>
          <i className="inline-block size-2 rounded-full bg-blue-600" /> DSA
        </span>
        <span>
          <i className="inline-block size-2 rounded-full bg-red-600" /> System
          Design
        </span>
        <span>
          <i className="inline-block size-2 rounded-full bg-purple-600" />{" "}
          Behaviour
        </span>
        <span>
          <i className="inline-block size-2 rounded-full bg-green-600" /> Java
          Theory
        </span>
        <span>
          <i className="inline-block size-2 rounded-full bg-orange-500" />{" "}
          Practical Coding
        </span>
      </p>
      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex justify-between">
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            Previous
          </button>
          <strong>
            {month.toLocaleString("en-GB", { month: "long", year: "numeric" })}
          </strong>
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const iso = d.toLocaleDateString("en-CA"),
              activityCount = state.activities.filter((a: any) => a.date === iso).length,
              domains = [
                ...new Set(
                  state.activities
                    .filter((a: any) => a.date === iso)
                    .map((a: any) => a.domain),
                ),
              ];
            return (
              <button
                key={iso}
                onClick={() => setDay(iso)}
                className={`calendar-day min-h-16 border p-1 text-left ${iso === day ? "bg-teal-50" : ""} ${d.getMonth() !== month.getMonth() ? "text-slate-400" : ""}`}
              >
                <time>{d.getDate()}</time>
                {activityCount > 0 && <span className="mt-1 block text-[10px] text-[#657777]">{activityCount} {activityCount === 1 ? "activity" : "activities"}</span>}
                <span className="mt-1 flex gap-1">
                  {domains.map((x: any) => (
                    <i
                      key={x}
                      title={`${x} activity`}
                      aria-label={`${x} activity`}
                      className={`inline-block size-2 rounded-full ${colours[x]}`}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="lc-panel rounded-xl border bg-white p-4">
          <h2 className="font-bold">{day} activities</h2>
          {state.activities.filter((x: any) => x.date === day).length === 0 ? (
            <p className="mt-3 text-[#657777]">
              No learning activity recorded.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-[#657777]">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Domain</th>
                    <th className="p-2">Item</th>
                    <th className="p-2">Result</th>
                    <th className="p-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {state.activities
                    .filter((x: any) => x.date === day)
                    .map((x: any) => (
                      <tr className="border-b" key={x.id}>
                        <td className="p-2">{x.date}</td>
                        <td className="p-2">{x.domain.replaceAll("_", " ")}</td>
                        <td className="p-2">{x.label}</td>
                        <td className="p-2">
                          <Badge>{x.result}</Badge>
                        </td>
                        <td className="p-2">
                          {x.durationMinutes ? `${x.durationMinutes} min` : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="lc-panel rounded-xl border bg-white p-4">
          <label className="block font-semibold">
            Daily note
            <DailyNoteField key={day} day={day} />
          </label>
          <p className="mt-2 text-sm text-[#657777]">
            Saved automatically a few seconds after you stop typing, or when you leave the field.
          </p>
        </div>
      </section>
    </>
  );
}
function SystemDesignPage() {
  const { state } = useAppState();
  const nav = useNavigate();
  const chapters = DDIA_CHAPTERS;
  const chaptersDone = chapters.filter((_, index) => state.ddiaChapters.find((c: any) => c.id === `CHAPTER_${index + 1}`)?.status === "DONE").length;
  return (
    <>
      <PageHeader title="System Design" />
      <DomainProgress name="DDIA" done={chaptersDone} total={chapters.length} />
      <nav className="app-tabs mb-4" aria-label="System Design tabs">
        <span className="app-tab app-tab--active" aria-current="page">DDIA</span>
        <Link className="app-tab" to="/system-design/hello-interview">Hello Interview</Link>
      </nav>
      <section className="lc-panel overflow-x-auto rounded-xl border bg-white p-4">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-[#657777]">
            <tr>
              <th className="p-2">Chapter</th>
              <th className="p-2">Title</th>
              <th className="p-2">Questions</th>
              <th className="p-2">Passed</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((title, index) => {
              const chapter = index + 1;
              const questions = state.learningItems.filter(
                (x: any) =>
                  x.domain === "DDIA" && x.track === `CHAPTER_${chapter}`,
              );
              const passed = questions.filter(
                (x: any) => x.latestResult === "PASS",
              ).length;
              const chapterStatus = state.ddiaChapters.find((c: any) => c.id === `CHAPTER_${chapter}`)?.status || "NOT_STARTED";
              return (
                <tr className="clickable-row border-b" key={chapter} tabIndex={0} role="link" onClick={() => nav(`/system-design/ddia/${chapter}`)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(`/system-design/ddia/${chapter}`); } }}>
                  <td className="p-2 font-semibold">{chapter}</td>
                  <td className="p-2">{title}</td>
                  <td className="p-2">{questions.length}</td>
                  <td className="p-2">{passed}</td>
                  <td className="p-2">
                    <Badge>{STATUS_LABEL[chapterStatus] || chapterStatus}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
function HelloInterviewPage() {
  const { state } = useAppState();
  const nav = useNavigate();
  return (
    <>
      <PageHeader title="System Design" />
      {domain(state, "Hello Interview", "SYSTEM_DESIGN")}
      <nav className="app-tabs mb-4" aria-label="System Design tabs">
        <Link className="app-tab" to="/system-design">DDIA</Link>
        <span className="app-tab app-tab--active" aria-current="page">Hello Interview</span>
      </nav>
      <section className="lc-panel overflow-x-auto rounded-xl border bg-white p-4">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-[#657777]">
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Category</th>
              <th className="p-2">Attempts</th>
              <th className="p-2">Latest result</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.systemDesignTasks.map((task: any) => {
              const attempt = task.attempts.at(-1);
              return (
                <tr className="clickable-row border-b" key={task.id} tabIndex={0} role="link" onClick={() => nav(`/system-design/hello-interview/${task.id}`)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(`/system-design/hello-interview/${task.id}`); } }}>
                  <td className="p-2 font-semibold">{task.title}</td>
                  <td className="p-2">{task.category}</td>
                  <td className="p-2">{task.attempts.length}</td>
                  <td className="p-2">
                    {attempt ? <Badge>{attempt.result}</Badge> : "—"}
                  </td>
                  <td className="p-2">
                    <Badge>{STATUS_LABEL[task.status] || task.status}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
function EditDisplayNameForm({ displayName: currentName, onDone }: { displayName: string; onDone: () => void }) {
  const { renameProfile } = useProfile();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      await renameProfile(trimmed);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your name.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => void handleSubmit(event)}>
      <input className="rounded border p-1 text-sm" value={name} onChange={(event) => setName(event.target.value)} required />
      <button type="submit" className="text-sm text-[#21675d] underline" disabled={saving || !name.trim()}>
        {saving ? "Saving…" : "Save"}
      </button>
      <button type="button" className="text-sm text-[#657777] underline" onClick={onDone}>
        Cancel
      </button>
      {error && <span className="text-sm text-[#923d36]">{error}</span>}
    </form>
  );
}
interface LeaderboardEntry {
  uid: string;
  name: string;
  initial: string;
  isYou: boolean;
  progress: Record<(typeof LEADERBOARD_DOMAINS)[number]["key"], { done: number; total: number }>;
}
function useLeaderboardEntries(currentUid: string | undefined): { loading: boolean; entries: LeaderboardEntry[] } {
  const [progressByUid, setProgressByUid] = useState<Record<string, StoredLeaderboardProgress>>({});
  const [profileNameByUid, setProfileNameByUid] = useState<Record<string, string>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  useEffect(() => {
    // Firestore denies these reads while signed out — don't even try, to avoid noisy
    // permission-denied console errors on a page LeaderboardPage renders a sign-in
    // prompt for anyway.
    if (!currentUid) { setProgressLoaded(true); return; }
    return subscribeAllProgress((all) => {
      setProgressByUid(Object.fromEntries(all.map((p) => [p.uid, p])));
      setProgressLoaded(true);
    });
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) { setProfilesLoaded(true); return; }
    return subscribeAllProfiles((all) => {
      setProfileNameByUid(Object.fromEntries(all.map((p) => [p.uid, p.displayName])));
      setProfilesLoaded(true);
    });
  }, [currentUid]);

  const entries: LeaderboardEntry[] = Object.values(progressByUid).flatMap((p) => {
    const name = profileNameByUid[p.uid];
    if (!name) return [];
    return [{
      uid: p.uid,
      name,
      initial: name.trim().charAt(0).toUpperCase() || "?",
      isYou: p.uid === currentUid,
      progress: {
        DDIA: { done: p.ddia.completed, total: p.ddia.total },
        HELLO_INTERVIEW: { done: p.helloInterview.completed, total: p.helloInterview.total },
        DSA: { done: p.dsa.completed, total: p.dsa.total },
      },
    }];
  });

  return { loading: !progressLoaded || !profilesLoaded, entries };
}
interface LeaderboardActivityEntry {
  uid: string;
  name: string;
  initial: string;
  isYou: boolean;
  label: string;
  occurredAt: string;
  domain: StoredLeaderboardActivity["domain"];
}
// Europe/London handles the BST/GMT switchover automatically via the IANA tz database, so
// this never needs manual daylight-saving-time logic.
const formatUkDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
// Fetches a wide-enough window across all domains so that, after splitting client-side per
// category below, each of DDIA/Hello Interview/DSA reliably has its own 10 most recent —
// avoids needing a per-domain composite Firestore index just for this feed.
const RECENT_ACTIVITY_FETCH_LIMIT = 90;
const RECENT_ACTIVITY_PER_CATEGORY_LIMIT = 10;
function useLeaderboardActivities(currentUid: string | undefined): { loading: boolean; activities: LeaderboardActivityEntry[] } {
  const [rawActivities, setRawActivities] = useState<StoredLeaderboardActivity[]>([]);
  const [profileNameByUid, setProfileNameByUid] = useState<Record<string, string>>({});
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  useEffect(() => {
    if (!currentUid) { setActivitiesLoaded(true); return; }
    return subscribeRecentActivities(RECENT_ACTIVITY_FETCH_LIMIT, (all) => {
      setRawActivities(all);
      setActivitiesLoaded(true);
    });
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) { setProfilesLoaded(true); return; }
    return subscribeAllProfiles((all) => {
      setProfileNameByUid(Object.fromEntries(all.map((p) => [p.uid, p.displayName])));
      setProfilesLoaded(true);
    });
  }, [currentUid]);

  const activities: LeaderboardActivityEntry[] = rawActivities.flatMap((a) => {
    const name = profileNameByUid[a.uid];
    if (!name) return [];
    return [{
      uid: a.uid,
      name,
      initial: name.trim().charAt(0).toUpperCase() || "?",
      isYou: a.uid === currentUid,
      label: a.label,
      occurredAt: a.occurredAt,
      domain: a.domain,
    }];
  });

  return { loading: !activitiesLoaded || !profilesLoaded, activities };
}
function LeaderboardPage() {
  // Reached only once AppAuthGate/ProfileGate confirm a signed-in user with a profile.
  const { user } = useAuth();
  const { profile } = useProfile();
  const [tab, setTab] = useState<(typeof LEADERBOARD_DOMAINS)[number]["key"]>("DDIA");
  const [editingName, setEditingName] = useState(false);
  const { loading: entriesLoading, entries } = useLeaderboardEntries(user?.uid);
  const { loading: activitiesLoading, activities } = useLeaderboardActivities(user?.uid);
  if (!user || !profile) return null;
  const activeDomain = LEADERBOARD_DOMAINS.find((d) => d.key === tab)!;
  const ranked = entries
    .map((u) => {
      const p = u.progress[tab];
      return { ...u, done: p.done, total: p.total, percentage: p.total ? Math.round((p.done / p.total) * 100) : 0 };
    })
    .sort((a, b) => b.percentage - a.percentage);
  const you = ranked.find((u) => u.isYou);
  const leader = ranked[0];
  const podium = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
  const activeDomainActivities = activities.filter((a) => a.domain === tab).slice(0, RECENT_ACTIVITY_PER_CATEGORY_LIMIT);
  return (
    <>
      <PageHeader title="Leaderboard" subtitle="Compare progress across the shared curriculum.">
        {editingName ? (
          <EditDisplayNameForm displayName={profile.displayName} onDone={() => setEditingName(false)} />
        ) : (
          <span className="text-sm text-[#657777]">
            Showing as <strong>{profile.displayName}</strong>{" "}
            <button type="button" className="text-[#21675d] underline" onClick={() => setEditingName(true)}>
              Edit name
            </button>
          </span>
        )}
      </PageHeader>
      <div className="leaderboard-tabs mb-5">
        {LEADERBOARD_DOMAINS.map((d) => (
          <button type="button" key={d.key} className={`leaderboard-tab ${tab === d.key ? "leaderboard-tab--active" : ""}`} onClick={() => setTab(d.key)}>
            <d.icon size={16} /> {d.label}
          </button>
        ))}
      </div>
      {entriesLoading ? (
        <section className="lc-panel mb-5 rounded-xl border bg-white p-8 text-center text-[#657777]">
          Loading leaderboard…
        </section>
      ) : ranked.length === 0 ? (
        <section className="lc-panel mb-5 rounded-xl border bg-white p-8 text-center text-[#657777]">
          No one has synced progress yet. Complete some tasks to appear here!
        </section>
      ) : (
        <>
          <div className="leaderboard-podium mb-5">
            {podium.map((u) => {
              const rank = ranked.indexOf(u) + 1;
              const isLeader = rank === 1;
              return (
                <div key={u.uid} className={`leaderboard-podium-card ${isLeader ? "leaderboard-podium-card--leader" : ""}`}>
                  <span className={`leaderboard-rank-badge leaderboard-rank-badge--${rank}`}>{rank}</span>
                  <div className="leaderboard-avatar">{u.initial}</div>
                  <div className="leaderboard-podium-card__name">
                    {u.name}
                    {u.isYou && <span className="leaderboard-you-tag">You</span>}
                  </div>
                  <div className="leaderboard-podium-card__pct">{u.percentage}%</div>
                  <div className="leaderboard-podium-card__sub">{u.done} / {u.total} {activeDomain.unit}</div>
                  <div className="leaderboard-podium-card__footer">
                    {isLeader ? (
                      <span className="leaderboard-podium-card__footer--leading"><Crown size={14} /> Leading</span>
                    ) : u.isYou ? (
                      `${leader.percentage - u.percentage}% behind 1st`
                    ) : (
                      `${Math.abs((you?.percentage ?? 0) - u.percentage)}% ${u.percentage <= (you?.percentage ?? 0) ? "behind" : "ahead of"} you`
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <section className="lc-panel mb-5 rounded-xl border bg-white p-4">
            <h2 className="font-bold">Full ranking</h2>
            <p className="mb-2 text-sm text-[#657777]">Only built-in curriculum items count toward progress.</p>
            {ranked.map((u, index) => (
              <div className="leaderboard-ranking-row" key={u.uid}>
                <span className={`leaderboard-ranking-badge leaderboard-rank-badge--${index + 1}`}>{index + 1}</span>
                <div className="leaderboard-ranking-name">
                  <div className="leaderboard-avatar leaderboard-avatar--sm">{u.initial}</div>
                  {u.name}
                  {u.isYou && <span className="leaderboard-you-tag">You</span>}
                </div>
                <div className="leaderboard-ranking-bar-wrap">
                  <div className="leaderboard-ranking-bar"><div style={{ width: `${u.percentage}%` }} /></div>
                </div>
                <div className="leaderboard-ranking-pct">{u.percentage}%</div>
                <div className="leaderboard-ranking-sub">{u.done} / {u.total} {activeDomain.unit}</div>
              </div>
            ))}
          </section>
        </>
      )}
      <section className="lc-panel rounded-xl border bg-white p-4">
        <h2 className="font-bold">Recent activities</h2>
        <p className="mb-2 text-sm text-[#657777]">See what everyone has been working on recently in {activeDomain.label}.</p>
        {activitiesLoading ? (
          <p className="text-sm text-[#657777]">Loading recent activity…</p>
        ) : activeDomainActivities.length === 0 ? (
          <p className="text-sm text-[#657777]">No recent activity yet.</p>
        ) : (
          activeDomainActivities.map((a) => (
            <div className="leaderboard-activity-row" key={`${a.uid}-${a.occurredAt}-${a.label}`}>
              <div className="leaderboard-activity-row__user">
                <div className="leaderboard-avatar leaderboard-avatar--sm">{a.initial}</div>
                <span>{a.name}</span>
                {a.isYou && <span className="leaderboard-you-tag">You</span>}
              </div>
              <div className="leaderboard-activity-row__text">
                <strong>completed</strong> {a.label}
              </div>
              <div className="leaderboard-activity-row__meta">
                {formatUkDateTime(a.occurredAt)}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
function TaskTextField({ label, value, onSave, multiline = false }: { label: string; value: string; onSave: (value: string) => void; multiline?: boolean }) {
  const field = useAutosaveField(value, onSave);
  return (
    <label className="mt-4 grid gap-1 font-semibold">
      {label}
      {multiline ? (
        <textarea className="min-h-28 rounded border p-2" value={field.value} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} />
      ) : (
        <input value={field.value} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} />
      )}
    </label>
  );
}
function Tasks({ system = false }: { system?: boolean }) {
  const { state, dispatch } = useAppState(),
    nav = useNavigate(),
    params = useParams(),
    collection = system ? "systemDesignTasks" : "functionalTasks",
    tasks = system ? state.systemDesignTasks : state.functionalTasks,
    id = params.id;
  const [title, setTitle] = useState(""),
    [editAttempt, setEditAttempt] = useState<string | null>(null);
  const task = tasks.find((x: any) => x.id === id);
  if (id) {
    if (!task)
      return (
        <Navigate
          to={system ? "/system-design/hello-interview" : "/functional-coding"}
        />
      );
    const update = (patch: any) =>
      dispatch({
        type: "UPSERT",
        payload: { collection, item: { id: task.id, ...patch } },
      });
    const detailFields = system
      ? [
          ["statement", "Problem statement"], ["functional", "Functional requirements"],
          ["nonFunctional", "Non-functional requirements"], ["capacity", "Capacity estimates"],
          ["api", "API design"], ["dataModel", "Data model"], ["highLevel", "High-level design"],
          ["scaling", "Scaling"], ["consistency", "Consistency"], ["reliability", "Reliability"],
          ["observability", "Observability"], ["security", "Security"], ["tradeoffs", "Trade-offs"],
          ["bottlenecks", "Bottlenecks"], ["notes", "Notes"],
        ]
      : [
          ["statement", "Problem statement"], ["requirements", "Functional requirements"],
          ["nonFunctional", "Non-functional requirements"], ["entities", "Entities"],
          ["services", "Services"], ["repositories", "Repositories"], ["api", "API design"],
          ["validation", "Validation"], ["errors", "Error handling"], ["tests", "Test cases"],
          ["notes", "Design notes"], ["link", "Repository link"], ["improvement", "Next improvement"],
        ];
    if (system) return <SystemDesignDetail key={task.id} task={task} update={update} learningItems={state.learningItems} dispatch={dispatch} onDelete={() => confirm("Delete this task?") && dispatch({ type: "DELETE", payload: { collection, id: task.id } })} onBack={() => nav("/system-design/hello-interview")} />;
    return (
      <>
        <button
          className="mb-3"
          onClick={() =>
            nav(
              system
                ? "/system-design/hello-interview"
                : "/functional-coding",
            )
          }
        >
          ← Back
        </button>
        <PageHeader title={task.title} />
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
          <div className="lc-panel rounded-xl border bg-white p-5">
            <p className="mb-4 text-sm text-[#657777]">
              Edit the exercise context and design notes. Changes save when you
              leave a field.
            </p>
            <TaskTextField key={`${task.id}-category`} label="Category" value={task.category} onSave={(value) => update({ category: value })} />
            {!system && <TaskTextField key={`${task.id}-tags`} label="Tags" value={String(task.tags || "")} onSave={(value) => update({ tags: value })} />}
            {detailFields.map(([key, label]) => <TaskTextField key={`${task.id}-${key}`} label={label} value={String(task[key] || "")} onSave={(value) => update({ [key]: value })} multiline />)}
            <button
              className="mt-5 rounded border px-3 py-2 text-[#923d36]"
              onClick={() =>
                confirm("Delete this task?") &&
                dispatch({
                  type: "DELETE",
                  payload: { collection, id: task.id },
                })
              }
            >
              Delete task
            </button>
          </div>
          <aside className="lc-panel rounded-xl border bg-white p-5">
            <h2 className="font-bold">Attempt history</h2>
            <p className="mb-3 text-sm text-[#657777]">
              Keep a concise record of each practice run.
            </p>
            {task.attempts.map((a: any) =>
              editAttempt === a.id ? (
                <form
                  key={a.id}
                  className="my-2 flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    update({
                      attempts: task.attempts.map((x: any) =>
                        x.id === a.id
                          ? {
                              ...x,
                              date: String(f.get("date")),
                              duration: Number(f.get("duration")),
                              result: String(f.get("result")),
                              notes: String(f.get("notes")),
                            }
                          : x,
                      ),
                    });
                    setEditAttempt(null);
                  }}
                >
                  <input name="date" type="date" defaultValue={a.date} />
                  <input
                    name="duration"
                    type="number"
                    defaultValue={a.duration}
                  />
                  <select name="result" defaultValue={a.result}>
                    <option>PASS</option>
                    <option>PARTIAL</option>
                    <option>FAIL</option>
                  </select>
                  <input name="notes" defaultValue={a.notes} />
                  <button>Save</button>
                  <button type="button" onClick={() => setEditAttempt(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="my-2 flex gap-2" key={a.id}>
                  <span className="flex-1">
                    {a.date} · {a.result} · {a.duration} min — {a.notes}
                  </span>
                  <button onClick={() => setEditAttempt(a.id)}>Edit</button>
                  <button
                    onClick={() =>
                      confirm("Delete this attempt?") &&
                      update({
                        attempts: task.attempts.filter(
                          (x: any) => x.id !== a.id,
                        ),
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              ),
            )}
            <button
              className="mt-2 rounded bg-[#21675d] px-3 py-2 text-white"
              onClick={() =>
                update({
                  attempts: [
                    ...task.attempts,
                    {
                      id: crypto.randomUUID(),
                      date: localDate(),
                      duration: 60,
                      result: "PARTIAL",
                      notes: "New attempt",
                    },
                  ],
                })
              }
            >
              Add attempt
            </button>
          </aside>
        </section>
      </>
    );
  }
  return (
    <>
      <PageHeader title={system ? "System Design" : "Practical Coding"} />
      {domain(
        state,
        system ? "System Design" : "Practical Coding",
        system ? "SYSTEM_DESIGN" : "FUNCTIONAL_CODING",
      )}
      {!system && (
        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (title) {
              const item = {
                id: crypto.randomUUID(),
                title,
                category: "Backend exercise",
                status: "NOT_STARTED",
                attempts: [],
                statement: "",
                notes: "",
              };
              dispatch({ type: "UPSERT", payload: { collection, item } });
              setTitle("");
            }
          }}
        >
          <input
            className="rounded border p-2"
            placeholder="New task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="rounded bg-teal-700 px-3 text-white">
            Add task
          </button>
        </form>
      )}
      <section className="task-table lc-panel overflow-x-auto rounded-xl border bg-white p-4">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-[#657777]">
            <tr><th className="p-2">Title</th><th className="p-2">Category</th><th className="p-2">Latest attempt</th><th className="p-2">Result</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr>
          </thead>
          <tbody>
            {tasks.map((x: any) => {
              const attempt = x.attempts.at(-1);
              const destination = `${system ? "/system-design/hello-interview" : "/functional-coding"}/${x.id}`;
              return <tr key={x.id}>
                <td className="p-2"><Link className="table-link font-semibold" to={destination}>{x.title}</Link></td>
                <td className="p-2">{x.category}</td>
                <td className="p-2">{attempt?.date || "—"}</td>
                <td className="p-2">{attempt ? <Badge>{attempt.result}</Badge> : "—"}</td>
                <td className="p-2"><Badge>{x.status}</Badge></td>
                <td className="p-2 whitespace-nowrap"><Link className="table-link mr-3" to={destination}>Edit</Link><button className="text-sm text-[#923d36]" onClick={() => confirm("Delete this task and all its attempts?") && dispatch({ type: "DELETE", payload: { collection, id: x.id } })}>Delete</button></td>
              </tr>;
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

function SystemDesignDetail({ task, update, onDelete, onBack, learningItems, dispatch }: { task: any; update: (patch: any) => void; onDelete: () => void; onBack: () => void; learningItems: any[]; dispatch: any }) {
  const [questionText, setQuestionText] = useState("");
  const [attemptOpen, setAttemptOpen] = useState(false);
  const notesField = useAutosaveField(String(task.notes || ""), (value) => update({ notes: value }));
  const attempts = Array.isArray(task.attempts) ? task.attempts : [];
  const questions = learningItems.filter((x: any) => x.domain === "SYSTEM_DESIGN" && x.track === task.id);
  const addQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!questionText.trim()) return;
    dispatch({
      type: "UPSERT",
      payload: {
        collection: "learningItems",
        item: {
          id: crypto.randomUUID(), domain: "SYSTEM_DESIGN", track: task.id,
          title: questionText, question: questionText, category: task.category,
          priority: "P1", modelAnswer: "", personalAnswer: "", notes: "",
          followUps: "", latestResult: null, lastPractisedAt: null,
          nextReviewAt: null, keyPoints: [],
        },
      },
    });
    setQuestionText("");
  };
  const logInterviewReady = () => {
    const today = localDate();
    dispatch({ type: "UPSERT", payload: { collection: "activities", item: { id: `activity-${task.id}-${today}`, date: today, domain: "SYSTEM_DESIGN", itemId: task.id, label: task.title, result: "PASS", durationMinutes: 0 } } });
  };
  const addAttempt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = String(form.get("result"));
    const nextStatus = result === "PASS" ? "INTERVIEW_READY" : "IN_PROGRESS";
    const wasNotReady = task.status !== "INTERVIEW_READY";
    update({ attempts: [...attempts, { id: crypto.randomUUID(), date: String(form.get("date")), duration: Number(form.get("duration")), result, notes: String(form.get("notes")) }], status: nextStatus });
    if (nextStatus === "INTERVIEW_READY" && wasNotReady) logInterviewReady();
    setAttemptOpen(false);
  };
  return <>
    <button className="mb-3" onClick={onBack}>← Back</button>
    <PageHeader title={task.title} />
    <p className="mb-5 text-sm text-[#657777]">{task.category} · Capture what you learned, questions to revisit, and every practice run.</p>
    <StatusPicker
      title="Have you done this mock interview?"
      value={task.status === "LEARNING" || task.status === "RETRY_DUE" ? "IN_PROGRESS" : task.status || "NOT_STARTED"}
      options={["NOT_STARTED", "IN_PROGRESS", "INTERVIEW_READY"]}
      onChange={(status) => {
        const wasNotReady = task.status !== "INTERVIEW_READY";
        update({ status });
        if (status === "INTERVIEW_READY" && wasNotReady) logInterviewReady();
      }}
    />
    <section className="lc-panel mb-4 rounded-xl border bg-white p-5">
      <h2 className="font-bold">Questions</h2>
      <p className="mb-3 text-sm text-[#657777]">Add the questions you want to be ready to answer for this design.</p>
      <form className="mb-3 flex gap-2" onSubmit={addQuestion}>
        <input required className="flex-1 rounded border p-2" value={questionText} onChange={(event) => setQuestionText(event.target.value)} placeholder="New interview question" />
        <button className="rounded bg-teal-700 px-3 text-white">Add question</button>
      </form>
      {questions.length ? <div className="question-list grid gap-0">{questions.map((item: any) => <QuestionRow key={item.id} item={item} />)}</div> : <p className="rounded-lg bg-[#f0f5f3] p-3 text-sm text-[#657777]">No questions yet. Add the first one above.</p>}
    </section>
    <section className="lc-panel mb-4 rounded-xl border bg-white p-5">
      <h2 className="font-bold">Learning notes</h2>
      <p className="mb-3 text-sm text-[#657777]">Key decisions, trade-offs, and improvements for next time.</p>
      <textarea aria-label="Learning notes" className="min-h-48 w-full" value={notesField.value} placeholder="For example: clarify requirements first, estimate peak traffic, and explain the cache invalidation strategy…" onChange={(event) => notesField.onChange(event.target.value)} onBlur={notesField.onBlur} />
    </section>
    <section className="lc-panel mb-4 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">Attempt record</h2><p className="text-sm text-[#657777]">Record the outcome and what to improve after each practice.</p></div><button className="bg-[#21675d] text-white" onClick={() => setAttemptOpen(!attemptOpen)}>{attemptOpen ? "Cancel" : "Record attempt"}</button></div>
      {attemptOpen && <form className="mt-4 grid gap-3 rounded-lg bg-[#f0f5f3] p-4 md:grid-cols-[150px_120px_130px_minmax(0,1fr)_auto] md:items-end" onSubmit={addAttempt}><label className="grid gap-1 font-semibold">Date<input name="date" type="date" defaultValue={localDate()} required /></label><label className="grid gap-1 font-semibold">Minutes<input name="duration" type="number" min="1" defaultValue="60" required /></label><label className="grid gap-1 font-semibold">Result<select name="result" defaultValue="PARTIAL"><option>PASS</option><option>PARTIAL</option><option>FAIL</option></select></label><label className="grid gap-1 font-semibold">Reflection<input name="notes" placeholder="What went well or needs work?" /></label><button className="bg-[#21675d] text-white">Save</button></form>}
      <div className="mt-4 grid gap-2">{attempts.length ? attempts.slice().reverse().map((attempt: any) => <article className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[#d9e3e0] px-3 py-2" key={attempt.id}><span className="font-semibold">{attempt.date}</span><Badge>{attempt.result}</Badge><span className="text-sm text-[#657777]">{attempt.duration} min</span><span className="min-w-48 flex-1 text-sm">{attempt.notes || "No reflection added."}</span><button className="text-sm text-[#923d36]" onClick={() => update({ attempts: attempts.filter((item: any) => item.id !== attempt.id) })}>Delete</button></article>) : <p className="rounded-lg bg-[#f0f5f3] p-3 text-sm text-[#657777]">No attempts recorded yet.</p>}</div>
    </section>
    <button className="mt-4 text-sm text-[#923d36]" onClick={onDelete}>Delete exercise</button>
  </>;
}
function Motivation() {
  const { state, dispatch } = useAppState(),
    [text, setText] = useState(""),
    [section, setSection] = useState("Benefits of changing jobs"),
    [editing, setEditing] = useState<string | null>(null),
    [draft, setDraft] = useState("");
  const sections = [
    "Benefits of changing jobs",
    "Costs of changing jobs",
    "Benefits of staying",
    "Costs of staying",
  ];
  const sectionPrompts: Record<string, string> = {
    "Benefits of changing jobs": "What would I gain by changing jobs?",
    "Costs of changing jobs": "What would changing jobs cost me?",
    "Benefits of staying": "What do I gain by staying?",
    "Costs of staying": "What does staying cost me?",
  };
  const add = () => {
    if (!text.trim()) return;
    dispatch({
      type: "UPSERT",
      payload: {
        collection: "motivationEntries",
        item: {
          id: crypto.randomUUID(),
          section,
          text,
          order: state.motivationEntries.length,
        },
      },
    });
    setText("");
  };
  return (
    <>
      <PageHeader title="Decision Balance" />
      <p className="mb-4 text-slate-600">
        This is a reminder of why the plan matters, not a way to guilt yourself into working.
      </p>
      <form
        className="mb-4 grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_2fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <select value={section} onChange={(e) => setSection(e.target.value)}>
          {sections.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <input
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an entry"
          className="rounded border p-2"
        />
        <button className="rounded bg-teal-700 px-3 text-white">Add</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((sectionName) => {
          const entries = state.motivationEntries.filter((entry: any) => entry.section === sectionName).sort((a: any, b: any) => a.order - b.order);
          return <section className="motivation-list rounded-xl border bg-white p-4" key={sectionName}>
            <h2 className="mb-2 font-bold">{sectionPrompts[sectionName]}</h2>
            {entries.length === 0 ? <p className="py-3 text-sm text-[#657777]">No entries yet.</p> : entries.map((x: any) => (
              <div className="flex items-center gap-2 border-b py-3" key={x.id}>
                {editing === x.id ? <><input className="flex-1 rounded border p-1" value={draft} onChange={(e) => setDraft(e.target.value)} /><button onClick={() => { dispatch({ type: "UPSERT", payload: { collection: "motivationEntries", item: { ...x, text: draft } } }); setEditing(null); }}>Save</button><button onClick={() => setEditing(null)}>Cancel</button></> : <><span className="flex-1">{x.text}</span><button onClick={() => { setEditing(x.id); setDraft(x.text); }}>Edit</button><button onClick={() => confirm("Delete this entry?") && dispatch({ type: "DELETE", payload: { collection: "motivationEntries", id: x.id } })}>Delete</button></>}
              </div>
            ))}
          </section>;
        })}
      </div>
    </>
  );
}
// Keyed by pathname so navigating to a different page remounts a fresh boundary (recovering
// from a crash without needing a full reload) — the Reload button inside ErrorBoundary is
// the guaranteed fallback for when the crash is on the current route itself.
function RoutedContent() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary key={pathname}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/motivation" element={<Motivation />} />
        <Route path="/weekly-plan" element={<WeeklyPlan />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/behaviour" element={<Questions kind="BEHAVIOUR" />} />
        <Route path="/java" element={<Questions kind="JAVA_THEORY" />} />
        <Route path="/dsa" element={<Dsa />} />
        <Route path="/dsa/:id" element={<DsaDetail />} />
        <Route path="/functional-coding" element={<Tasks />} />
        <Route path="/functional-coding/:id" element={<Tasks />} />
        <Route path="/system-design" element={<SystemDesignPage />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route
          path="/system-design/ddia/:chapterId"
          element={<Questions kind="DDIA" />}
        />
        <Route
          path="/system-design/hello-interview"
          element={<HelloInterviewPage />}
        />
        <Route
          path="/system-design/hello-interview/:id"
          element={<Tasks system />}
        />
      </Routes>
    </ErrorBoundary>
  );
}
export default function App() {
  return (
    <LeaderboardSyncProvider>
    <HashRouter>
      <Shell>
        <RoutedContent />
      </Shell>
    </HashRouter>
    </LeaderboardSyncProvider>
  );
}
